import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Swords, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageTransition from '@/components/PageTransition';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useDictionary } from '@/contexts/DictionaryContext';

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

type DuelRow = {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  status: string;
  current_question: number;
  questions: { aramaic: string; hebrew: string; options: string[] }[];
  host_score: number;
  guest_score: number;
  host_answer: { q: number; choice: string } | null;
  guest_answer: { q: number; choice: string } | null;
};

const TOTAL_QUESTIONS = 5;

const Duel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const { dictionary } = useDictionary();
  const [mode, setMode] = useState<'menu' | 'lobby' | 'play' | 'end'>('menu');
  const [joinCode, setJoinCode] = useState('');
  const [duel, setDuel] = useState<DuelRow | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Build a set of MCQ questions from the dictionary
  const buildQuestions = useCallback(() => {
    const pool = dictionary.filter((w) => w.aramaic && w.hebrew);
    const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    return picks.map((w) => {
      const distractors = pool
        .filter((p) => p.hebrew !== w.hebrew)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((p) => p.hebrew);
      return {
        aramaic: w.aramaic, hebrew: w.hebrew,
        options: [...distractors, w.hebrew].sort(() => Math.random() - 0.5),
      };
    });
  }, [dictionary]);

  const subscribe = useCallback((id: string) => {
    subRef.current?.unsubscribe();
    subRef.current = supabase
      .channel(`duel-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            toast('המשחק הסתיים'); setMode('menu'); setDuel(null); return;
          }
          setDuel(payload.new as unknown as DuelRow);
        })
      .subscribe();
  }, []);

  const handleCreate = async () => {
    if (!user) return;
    const code = genCode();
    const questions = buildQuestions();
    const { data, error } = await supabase
      .from('duels')
      .insert({ code, host_id: user.id, status: 'waiting', questions })
      .select().single();
    if (error || !data) { toast.error('יצירת חדר נכשלה'); return; }
    setDuel(data as unknown as DuelRow); setMode('lobby'); subscribe(data.id);
  };

  const handleJoin = async (codeIn?: string) => {
    if (!user) return;
    const code = (codeIn ?? joinCode).trim().toUpperCase();
    if (code.length !== 5) { toast.error('הקוד הוא 5 תווים'); return; }
    const { data } = await supabase.from('duels').select('*').eq('code', code).maybeSingle();
    if (!data) { toast.error('חדר לא נמצא'); return; }
    if (data.guest_id && data.guest_id !== user.id) { toast.error('החדר תפוס'); return; }
    if (data.host_id === user.id) {
      setDuel(data as unknown as DuelRow); setMode(data.status === 'playing' ? 'play' : 'lobby'); subscribe(data.id); return;
    }
    const { data: updated } = await supabase
      .from('duels').update({ guest_id: user.id, status: 'playing' }).eq('id', data.id).select().single();
    setDuel((updated || data) as unknown as DuelRow); setMode('play'); subscribe(data.id);
  };

  // Auto-route lobby → play
  useEffect(() => {
    if (!duel) return;
    if (duel.status === 'playing' && mode !== 'end') setMode('play');
    if (duel.status === 'done') setMode('end');
  }, [duel, mode]);

  // Resolve round: when both answers in for current question
  useEffect(() => {
    if (!duel || !user || duel.host_id !== user.id) return; // host adjudicates
    if (duel.status !== 'playing') return;
    if (duel.host_answer?.q === duel.current_question && duel.guest_answer?.q === duel.current_question) {
      const correct = duel.questions[duel.current_question]?.hebrew;
      const hostRight = duel.host_answer.choice === correct;
      const guestRight = duel.guest_answer.choice === correct;
      const next = duel.current_question + 1;
      const updates: Partial<DuelRow> = {
        host_score: duel.host_score + (hostRight ? 1 : 0),
        guest_score: duel.guest_score + (guestRight ? 1 : 0),
        host_answer: null, guest_answer: null,
        current_question: next,
        status: next >= TOTAL_QUESTIONS ? 'done' : 'playing',
      };
      setTimeout(() => { supabase.from('duels').update(updates).eq('id', duel.id); }, 1200);
    }
  }, [duel, user]);

  useEffect(() => () => { subRef.current?.unsubscribe(); }, []);

  // Auto-join via URL param
  useEffect(() => {
    if (params.code && user && mode === 'menu') {
      setJoinCode(params.code); handleJoin(params.code);
    }
  }, [params.code, user]); // eslint-disable-line

  const submitAnswer = async (choice: string) => {
    if (!duel || !user || chosen) return;
    setChosen(choice);
    const field = duel.host_id === user.id ? 'host_answer' : 'guest_answer';
    await supabase.from('duels').update({ [field]: { q: duel.current_question, choice } }).eq('id', duel.id);
  };

  useEffect(() => { setChosen(null); }, [duel?.current_question]);

  if (!user) { navigate('/auth'); return null; }

  const isHost = duel?.host_id === user.id;
  const myScore = isHost ? duel?.host_score : duel?.guest_score;
  const oppScore = isHost ? duel?.guest_score : duel?.host_score;
  const oppId = isHost ? duel?.guest_id : duel?.host_id;
  const currentQ = duel?.questions?.[duel.current_question];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24" dir="rtl">
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-5 relative">
          <button onClick={() => navigate('/')} className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted"><ArrowRight className="w-5 h-5" /></button>
          <div className="text-center pt-2">
            <Swords className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-2xl font-display font-bold mt-2">דו קרב</h1>
            <p className="text-xs text-muted-foreground">משחק מהיר בין שני שחקנים · ללא פרסים</p>
          </div>
        </div>

        <div className="px-6 mt-6 space-y-4">
          {mode === 'menu' && (
            <>
              <Button size="lg" className="w-full" onClick={handleCreate}>🆕 צור חדר חדש</Button>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="font-semibold text-sm">הצטרף עם קוד</p>
                <div className="flex gap-2">
                  <Input value={joinCode} maxLength={5} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="W45JG" className="text-center tracking-widest font-mono uppercase" />
                  <Button onClick={() => handleJoin()}>הצטרף</Button>
                </div>
              </div>
            </>
          )}

          {mode === 'lobby' && duel && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">שתף את הקוד עם החבר</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-mono font-bold tracking-widest text-primary">{duel.code}</span>
                <button onClick={() => { navigator.clipboard.writeText(duel.code); toast.success('הקוד הועתק'); }} className="p-2 rounded-full hover:bg-muted"><Copy className="w-4 h-4" /></button>
              </div>
              <p className="text-sm">⏳ ממתין ליריב…</p>
            </div>
          )}

          {mode === 'play' && duel && currentQ && (
            <>
              <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3">
                <div className="flex items-center gap-2"><UserAvatar userId={user.id} size={36} /><span className="font-bold text-primary">{myScore}</span></div>
                <span className="text-xs text-muted-foreground">שאלה {duel.current_question + 1}/{TOTAL_QUESTIONS}</span>
                <div className="flex items-center gap-2"><span className="font-bold text-primary">{oppScore}</span><UserAvatar userId={oppId} size={36} /></div>
              </div>
              <motion.div key={duel.current_question} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">מה התרגום?</p>
                <p className="text-3xl font-display font-bold mb-4">{currentQ.aramaic}</p>
                <div className="grid grid-cols-1 gap-2">
                  {currentQ.options.map((opt) => (
                    <Button key={opt} variant={chosen === opt ? 'default' : 'outline'} disabled={!!chosen} onClick={() => submitAnswer(opt)} className="h-12">
                      {opt}
                    </Button>
                  ))}
                </div>
                {chosen && <p className="text-xs text-muted-foreground mt-3">ממתין ליריב…</p>}
              </motion.div>
            </>
          )}

          {mode === 'end' && duel && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
              <h2 className="text-2xl font-bold">
                {myScore === oppScore ? '🤝 תיקו!' : (myScore ?? 0) > (oppScore ?? 0) ? '🏆 ניצחת!' : '😞 הפסדת'}
              </h2>
              <p className="text-muted-foreground">{myScore} : {oppScore}</p>
              <p className="text-xs text-muted-foreground">משחק לכיף — לא נצברו מטבעות / יהלומים / XP</p>
              <Button onClick={() => { setMode('menu'); setDuel(null); }} className="w-full">חזור לתפריט</Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Duel;
