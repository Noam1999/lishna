import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDictionary, DictionaryWord } from '@/contexts/DictionaryContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';

interface Assignment { id: string; title: string; type: string; word_ids: number[]; class_id: string; }
interface Question { word: DictionaryWord; options: string[]; correctAnswer: string; }

const TakeAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dictionary } = useDictionary();
  const { awardScoreRewards } = useProfile();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [details, setDetails] = useState<{ word_id: number; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { document.title = 'מטלה | לישנא'; }, []);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase.from('assignments').select('*').eq('id', id).maybeSingle();
      setAssignment(data as Assignment | null);
    })();
  }, [id]);

  useEffect(() => {
    if (!assignment) return;
    const words = dictionary.filter((w) => assignment.word_ids.includes(w.id));
    if (words.length < 4) { toast.error('לא מספיק מילים במטלה'); return; }
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const qs: Question[] = shuffled.map((word) => {
      const others = words.filter((w) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w.hebrew);
      const options = [...others, word.hebrew].sort(() => Math.random() - 0.5);
      return { word, options, correctAnswer: word.hebrew };
    });
    setQuestions(qs);
  }, [assignment, dictionary]);

  const current = questions[idx];
  const isCorrect = selected === current?.correctAnswer;

  const handleAnswer = (ans: string) => {
    if (showResult || !current) return;
    setSelected(ans); setShowResult(true);
    const correct = ans === current.correctAnswer;
    if (correct) setScore((s) => s + 1);
    setDetails((d) => [...d, { word_id: current.word.id, correct }]);
    setTimeout(() => {
      if (idx < questions.length - 1) {
        setIdx((i) => i + 1); setSelected(null); setShowResult(false);
      } else {
        setDone(true);
      }
    }, 1500);
  };

  useEffect(() => {
    if (!done || !assignment || !user || submitting) return;
    setSubmitting(true);
    const finalScore = score; // already includes last
    supabase.from('assignment_submissions').upsert({
      assignment_id: assignment.id,
      student_id: user.id,
      score: finalScore,
      total: questions.length,
      details,
    }, { onConflict: 'assignment_id,student_id' }).then(async ({ error }) => {
      if (error) {
        toast.error('שגיאה בשליחת התוצאה');
      } else {
        const pct = questions.length ? Math.round((finalScore / questions.length) * 100) : 0;
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

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted" aria-label="חזור">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">{assignment.title}</h1>
          <p className="text-xs text-muted-foreground">שאלה {idx + 1} מתוך {questions.length}</p>
        </div>
        <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold text-primary">{score}</div>
      </div>

      <div className="px-6 mt-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-l from-primary to-primary/70" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="px-6 mt-6 mb-6">
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">מה הפירוש של:</p>
          <p className="text-4xl font-display font-bold">{current.word.aramaic}</p>
        </div>
      </div>

      <div className="px-6 space-y-3">
        {current.options.map((opt, i) => {
          const isSel = selected === opt;
          const isAnswer = opt === current.correctAnswer;
          let cls = 'w-full h-14 text-lg justify-start px-6 transition-all min-h-[44px] ';
          if (showResult) {
            if (isAnswer) cls += 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300';
            else if (isSel) cls += 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300';
            else cls += 'opacity-40';
          } else cls += 'hover:bg-accent';
          return (
            <motion.div key={`${idx}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={!showResult ? { scale: 0.97 } : undefined}>
              <Button variant="outline" onClick={() => handleAnswer(opt)} disabled={showResult} className={cls}>
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
            {isCorrect ? '🎉 נכון מאוד!' : <>לא נכון · התשובה: <strong>{current.correctAnswer}</strong></>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PageTransition>
  );
};

export default TakeAssignment;
