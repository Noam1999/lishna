import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, ArrowRight, Zap, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDictionary } from '@/contexts/DictionaryContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';
import { haptic } from '@/lib/haptics';
import GemaraText from '@/components/GemaraText';
import { fetchSefariaAmud } from '@/lib/sefaria';


interface AssignmentSettings {
  allowPowerUps?: boolean;
  shuffleQuestions?: boolean;
  timerEnabled?: boolean;
  secondsPerQuestion?: number;
  /** true = study mode (tooltips + highlights), false = test mode (no hints at all) */
  studyMode?: boolean;
}
interface GemaraQuestion { q: string; options: string[]; correct: number }
interface AssignmentSource { masechet?: string; daf?: string; amud?: string; sefaria?: string; dafNum?: string; amudId?: 'a' | 'b' }
interface Assignment { id: string; title: string; type: string; word_ids: number[]; class_id: string; settings?: AssignmentSettings | null; mode?: string | null; questions?: GemaraQuestion[] | null; source?: AssignmentSource | null; }

interface Question { prompt: string; options: string[]; correctAnswer: string; wordId?: number; questionIndex?: number; isGemara?: boolean; }

const TakeAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dictionary } = useDictionary();
  const { profile, awardScoreRewards, usePowerUp5050 } = useProfile();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [details, setDetails] = useState<{ word_id?: number; question_index?: number; correct: boolean }[]>([]);
  const startedAt = useRef<number>(Date.now());
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [usedThisQuestion, setUsedThisQuestion] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settings = assignment?.settings || {};
  const allowPowerUps = settings.allowPowerUps !== false;
  const shuffle = !!settings.shuffleQuestions;
  const timerEnabled = !!settings.timerEnabled;
  const seconds = Math.max(5, settings.secondsPerQuestion || 20);
  const studyMode = settings.studyMode !== false;
  const isGemaraMode = assignment?.mode === 'gemara';

  // Interactive Gemara text panel (loaded from Sefaria when the teacher picked a daf)
  const [textLines, setTextLines] = useState<string[]>([]);
  useEffect(() => {
    const src = assignment?.source;
    if (!isGemaraMode || !src?.sefaria || !src.dafNum) { setTextLines([]); return; }
    let cancelled = false;
    fetchSefariaAmud(src.sefaria, src.dafNum, src.amudId || 'a')
      .then(({ lines }) => { if (!cancelled) setTextLines(lines); })
      .catch(() => { if (!cancelled) setTextLines([]); });
    return () => { cancelled = true; };
  }, [assignment?.source, isGemaraMode]);

  useEffect(() => { document.title = 'מטלה | לישנא'; }, []);


  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
      setAssignment(data as unknown as Assignment | null);
    })();
  }, [id]);

  useEffect(() => {
    if (!assignment) return;
    if (assignment.mode === 'gemara') {
      const src = assignment.questions || [];
      if (!src.length) { toast.error('אין שאלות במטלה'); return; }
      const withIdx = src.map((q, i) => ({ q, i }));
      const ordered = shuffle ? [...withIdx].sort(() => Math.random() - 0.5) : withIdx;
      setQuestions(ordered.map(({ q, i }) => ({
        prompt: q.q,
        options: [...q.options].sort(() => Math.random() - 0.5),
        correctAnswer: q.options[q.correct],
        questionIndex: i,
        isGemara: true,
      })));
      return;
    }
    const words = dictionary.filter((w) => assignment.word_ids.includes(w.id));
    if (words.length < 4) { toast.error('לא מספיק מילים במטלה'); return; }
    const ordered = shuffle ? [...words].sort(() => Math.random() - 0.5) : words;
    const qs: Question[] = ordered.map((word) => {
      const others = words.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w.hebrew);
      const options = [...others, word.hebrew].sort(() => Math.random() - 0.5);
      return { prompt: word.aramaic, options, correctAnswer: word.hebrew, wordId: word.id };
    });
    setQuestions(qs);
  }, [assignment, dictionary, shuffle]);

  const current = questions[idx];
  const isCorrect = selected === current?.correctAnswer;

  const goNext = useMemo(() => () => {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1); setSelected(null); setShowResult(false);
      setHiddenOptions([]); setUsedThisQuestion(false);
    } else {
      setDone(true);
    }
  }, [idx, questions.length]);

  const handleAnswer = (ans: string | null) => {
    if (showResult || !current) return;
    if (ans !== null) haptic(15);
    setSelected(ans); setShowResult(true);
    const correct = ans !== null && ans === current.correctAnswer;
    if (correct) setScore((s) => s + 1);
    setDetails((d) => [...d, current.isGemara
      ? { question_index: current.questionIndex as number, correct }
      : { word_id: current.wordId as number, correct }]);
    advanceTimer.current = setTimeout(goNext, 1500);
  };

  // Per-question countdown
  useEffect(() => {
    if (!timerEnabled || !current || showResult || done) { setTimeLeft(null); return; }
    setTimeLeft(seconds);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return t;
        if (t <= 1) {
          clearInterval(interval);
          handleAnswer(null); // time up
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, timerEnabled, seconds, showResult, done, current?.prompt]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  useEffect(() => {
    if (!done || !assignment || !user || submitting) return;
    setSubmitting(true);
    // The score is computed and stored by the server from the submitted answers.
    supabase.rpc('submit_assignment', {
      _assignment_id: assignment.id,
      _details: details,
      _duration_seconds: Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)),
    }).then(async ({ data, error }) => {
      const res = data as { error?: string; score?: number; total?: number } | null;
      if (error || !res || res.error) {
        toast.error(res?.error === 'already_submitted' ? 'כבר הגשת את המטלה' : 'שגיאה בשליחת התוצאה');
      } else {
        const total = res.total || questions.length || 1;
        const pct = Math.round(((res.score ?? 0) / total) * 100);
        const rewards = await awardScoreRewards(pct);
        toast.success(`התוצאה נשלחה! +${rewards?.coinsEarned ?? 0} 💰  +${rewards?.xpEarned ?? 0} ✨`);
      }
    });
  }, [done, assignment, user, score, questions.length, details, submitting, awardScoreRewards]);

  if (!assignment) return <div className="min-h-screen flex items-center justify-center">טוען...</div>;

  if (done) {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <PageTransition>
        <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-6 text-center" dir="rtl">
          <Trophy className="w-20 h-20 text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">סיימת!</h1>
          <p className="text-6xl font-bold text-primary my-3">ציון: {pct}</p>
          <p className="text-lg text-foreground mb-1">ענית נכון על {score} מתוך {questions.length} שאלות</p>
          <p className="text-sm text-muted-foreground mb-6">התוצאה נשלחה למורה</p>
          <Button onClick={() => navigate(`/classes/${assignment.class_id}`)}>חזרה לכיתה</Button>
        </div>
      </PageTransition>
    );
  }

  if (!current) return <div className="min-h-screen flex items-center justify-center">טוען...</div>;

  const canUse5050 = allowPowerUps && profile && profile.power_up_5050 > 0 && !usedThisQuestion && !showResult && current.options.length >= 4;

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted" aria-label="חזור">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">{assignment.title}</h1>
          <p className="text-xs text-muted-foreground">
            שאלה {idx + 1} מתוך {questions.length}
            {assignment.source?.masechet ? ` · ${assignment.source.masechet} ${assignment.source.daf || ''} ${assignment.source.amud || ''}` : ''}
          </p>
        </div>
        {timerEnabled && timeLeft !== null && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${timeLeft <= 5 ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
            <Timer className="w-4 h-4" /> {timeLeft}
          </div>
        )}
        <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold text-primary">{score}</div>
      </div>

      <div className="px-6 mt-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-l from-primary to-primary/70" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="px-6 mt-4 flex items-center justify-end">
        {canUse5050 && (
          <button
            onClick={async () => {
              const wrongs = current.options.filter((o) => o !== current.correctAnswer);
              const toHide = wrongs.sort(() => Math.random() - 0.5).slice(0, 2);
              setHiddenOptions(toHide);
              setUsedThisQuestion(true);
              await usePowerUp5050();
            }}
            className="flex items-center gap-1 bg-sky-500/15 border border-sky-500/40 text-sky-700 dark:text-sky-300 rounded-full px-3 py-1.5 text-xs font-bold hover:bg-sky-500/25 transition-all"
          >
            <Zap className="w-3.5 h-3.5" /> 50:50 ({profile.power_up_5050})
          </button>
        )}
      </div>

      <div className="px-6 mt-4 mb-6">
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">{current.isGemara ? 'שאלה:' : 'מה הפירוש של:'}</p>
          <p className={current.isGemara ? 'text-2xl font-bold leading-relaxed' : 'text-4xl font-display font-bold'}>{current.prompt}</p>
        </div>
      </div>

      <div className="px-6 space-y-3">
        {current.options.map((opt, i) => {
          const isSel = selected === opt;
          const isAnswer = opt === current.correctAnswer;
          const isHidden = hiddenOptions.includes(opt);
          let cls = 'w-full h-14 text-lg justify-start px-6 transition-all min-h-[44px] ';
          if (isHidden && !showResult) cls += 'opacity-20 line-through pointer-events-none';
          else if (showResult) {
            if (isAnswer) cls += 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300';
            else if (isSel) cls += 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300';
            else cls += 'opacity-40';
          } else cls += 'hover:bg-accent';
          return (
            <motion.div key={`${idx}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={!showResult ? { scale: 0.97 } : undefined}>
              <Button variant="outline" onClick={() => handleAnswer(opt)} disabled={showResult || isHidden} className={cls}>
                <span className="flex-1 text-right">{opt}</span>
                {showResult && isAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                {showResult && isSel && !isAnswer && <XCircle className="w-5 h-5 text-red-600" />}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-6 mt-4 p-4 rounded-xl text-center font-medium"
            style={{ background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {isCorrect ? '🎉 נכון מאוד!' : <>{selected === null ? 'הזמן נגמר · ' : 'לא נכון · '}התשובה: <strong>{current.correctAnswer}</strong></>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
};

export default TakeAssignment;
