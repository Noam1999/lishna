import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Film,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  Lock,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEDARIM, type GlossWord, type QuizQuestion } from '@/data/experiential';
import { SHAS, dapimOf, gematria } from '@/data/shas';
import { YERUSHALMI } from '@/data/yerushalmi';
import { fetchSefariaAmud } from '@/lib/sefaria';
import GemaraText, { useDictLookup } from '@/components/GemaraText';
import { removeNiqqud, useDictionary, type DictionaryWord } from '@/contexts/DictionaryContext';
import { useUserWords } from '@/hooks/useUserWords';
import { useAuth } from '@/contexts/AuthContext';
import { sfxCorrect, sfxIncorrect } from '@/lib/audio';
import { haptic } from '@/lib/haptics';

const PERSONAL_KEY = 'lishna:personal-dict';

/** Curated demo content for Berakhot 2a (fallback + enriched quiz) */
const berakhotAmud = SEDARIM[0].masechtot[0].dapim[0].amudim[0];


const Experiential = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { dictionary } = useDictionary();
  const { markWordAsLearned } = useUserWords();
  const lookup = useDictLookup();

  const [corpus, setCorpus] = useState<'bavli' | 'yerushalmi'>('bavli');
  const CORPUS = corpus === 'bavli' ? SHAS : YERUSHALMI;

  const [sederId, setSederId] = useState('zeraim');
  const [masechetId, setMasechetId] = useState('berakhot');
  const [dafId, setDafId] = useState('2');
  const [amudId, setAmudId] = useState<'a' | 'b'>('a');

  const seder = CORPUS.find((s) => s.id === sederId) ?? CORPUS[0];
  const masechet = seder.masechtot.find((x) => x.id === masechetId) ?? seder.masechtot[0];
  const dapim = useMemo(() => dapimOf(masechet), [masechet]);

  const [studyMode, setStudyMode] = useState(true);
  const [fullText, setFullText] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PERSONAL_KEY) || '[]').map((w: GlossWord) => w.word);
    } catch {
      return [];
    }
  });

  // Keep cascading selectors valid
  useEffect(() => {
    if (!CORPUS.some((s) => s.id === sederId)) setSederId(CORPUS[0].id);
  }, [corpus]);
  useEffect(() => {
    if (!seder.masechtot.some((x) => x.id === masechetId)) setMasechetId(seder.masechtot[0].id);
  }, [sederId, corpus]);
  useEffect(() => {
    if (!dapim.some((d) => d.id === dafId)) setDafId(dapim[0]?.id ?? '2');
  }, [masechetId, corpus]);

  // ---- Sefaria text ----
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isDemo = corpus === 'bavli' && masechetId === 'berakhot' && dafId === '2' && amudId === 'a';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!masechet.sefaria) {
        setLines([]);
        setLoadError(
          corpus === 'bavli'
            ? 'למסכת זו אין תלמוד בבלי — בחר מסכת אחרת.'
            : 'למסכת זו אין תלמוד ירושלמי — בחר מסכת אחרת.'
        );
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const { lines: fetched } = await fetchSefariaAmud(masechet.sefaria, dafId, amudId);
        if (!cancelled) setLines(fetched);
      } catch {
        if (!cancelled) {
          if (isDemo) {
            setLines(berakhotAmud.text.replace(/\[\[|\]\]/g, '').split('\n'));
            setLoadError(null);
          } else {
            setLines([]);
            setLoadError('לא הצלחנו לטעון את הטקסט כרגע. נסה שוב או בחר עמוד אחר.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [masechet.sefaria, dafId, amudId, corpus]);

  // ---- Matched words on the current page ----
  const matchedWords = useMemo(() => {
    const found = new Map<number, DictionaryWord>();
    lines.forEach((line) =>
      line.split(/\s+/).forEach((tok) => {
        const hit = lookup(tok);
        if (hit) found.set(hit.id, hit);
      })
    );
    return Array.from(found.values());
  }, [lines, lookup]);


  // ---- Quiz ----
  const quiz: QuizQuestion[] = useMemo(() => {
    if (isDemo) return berakhotAmud.quiz;
    const pool = matchedWords.slice(0, 5);
    return pool.map((w) => {
      const distractors = dictionary
        .filter((d) => d.id !== w.id && d.hebrew !== w.hebrew)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((d) => d.hebrew);
      const options = [...distractors, w.hebrew].sort(() => Math.random() - 0.5);
      return {
        question: `מה פירוש המילה "${w.aramaic}"?`,
        options,
        correct: options.indexOf(w.hebrew),
        explanation: w.culturalContext,
      };
    });
  }, [isDemo, matchedWords, dictionary]);

  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const resetQuiz = () => {
    setQIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };
  useEffect(resetQuiz, [sederId, masechetId, dafId, amudId, quiz.length]);

  const saveWord = async (g: GlossWord) => {
    haptic();
    if (saved.includes(g.word)) return;
    let list: GlossWord[] = [];
    try {
      list = JSON.parse(localStorage.getItem(PERSONAL_KEY) || '[]');
    } catch {
      list = [];
    }
    list.push(g);
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(list));
    setSaved((prev) => [...prev, g.word]);

    const match = dictionary.find((w) => removeNiqqud(w.aramaic) === removeNiqqud(g.word));
    if (user && match) await markWordAsLearned(match.id);
    toast.success(`"${g.word}" נשמרה למילון האישי ⭐`);
  };

  const answer = (i: number) => {
    if (picked !== null) return;
    haptic();
    setPicked(i);
    if (i === quiz[qIndex].correct) {
      setScore((s) => s + 1);
      sfxCorrect();
    } else {
      sfxIncorrect();
    }
  };

  const next = () => {
    if (qIndex + 1 >= quiz.length) setFinished(true);
    else {
      setQIndex((i) => i + 1);
      setPicked(null);
    }
  };

  const renderText = () => (
    <GemaraText
      lines={lines}
      studyMode={studyMode}
      savedWords={saved}
      onSave={(entry) =>
        saveWord({ word: entry.aramaic, hebrew: entry.hebrew, context: entry.culturalContext ?? '' })
      }
    />
  );


  const q = quiz[qIndex];
  const amudLabel = amudId === 'a' ? "עמוד א'" : "עמוד ב'";
  const dafLabel = `דף ${gematria(Number(dafId))}`;

  if (!authLoading && !user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">
            יש להתחבר כדי להיכנס ללימוד חווייתי 🔐
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            הלימוד החווייתי כולל טקסט חי, מילון אינטראקטיבי וחידונים — פתוח למשתמשים רשומים.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/auth')}>התחברות / הרשמה</Button>
            <Button variant="outline" onClick={() => navigate('/')}>חזרה לדף הבית</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (

    <PageTransition>
      <div className="min-h-screen bg-background pb-28" dir="rtl">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-hero opacity-10" />
          <div className="relative z-10 px-4 pt-6 pb-5 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/"
                className="w-9 h-9 rounded-full bg-card/80 border border-border flex items-center justify-center shadow-soft"
                aria-label="חזרה לדף הבית"
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  לימוד חווייתי
                </h1>
                <p className="text-xs text-muted-foreground">
                  {seder.label} · מסכת {masechet.label} · {dafLabel} {amudLabel}
                </p>
              </div>
            </div>

            {/* Selectors + mode toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={corpus} onValueChange={(v) => setCorpus(v as 'bavli' | 'yerushalmi')}>
                <SelectTrigger className="w-[150px] bg-card" aria-label="תלמוד">
                  <SelectValue placeholder="תלמוד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bavli">תלמוד בבלי</SelectItem>
                  <SelectItem value="yerushalmi">תלמוד ירושלמי</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sederId} onValueChange={setSederId}>
                <SelectTrigger className="w-[150px] bg-card" aria-label="סדר">
                  <SelectValue placeholder="סדר" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CORPUS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Select value={masechetId} onValueChange={setMasechetId}>
                <SelectTrigger className="w-[150px] bg-card" aria-label="מסכת">
                  <SelectValue placeholder="מסכת" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {seder.masechtot.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.label}{!x.sefaria ? ' (לא זמין)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dafId} onValueChange={setDafId} disabled={!dapim.length}>
                <SelectTrigger className="w-[120px] bg-card" aria-label="דף">
                  <SelectValue placeholder="דף" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {dapim.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={amudId} onValueChange={(v) => setAmudId(v as 'a' | 'b')}>
                <SelectTrigger className="w-[110px] bg-card" aria-label="עמוד">
                  <SelectValue placeholder="עמוד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">עמוד א'</SelectItem>
                  <SelectItem value="b">עמוד ב'</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => { haptic(); setFullText((v) => !v); }}
                className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 shadow-soft text-xs font-medium text-foreground hover:bg-accent transition-colors"
                aria-label={fullText ? 'הצגת השאלות' : 'מסך מלא'}
              >
                {fullText ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {fullText ? 'הצג שאלות' : 'מסך מלא ⛶'}
              </button>

              <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 shadow-soft mr-auto">
                <span className={`text-xs font-medium ${studyMode ? 'text-primary' : 'text-muted-foreground'}`}>
                  מצב לימוד
                </span>
                <Switch
                  checked={!studyMode}
                  onCheckedChange={(v) => setStudyMode(!v)}
                  aria-label="מעבר בין מצב לימוד למצב מבחן"
                />
                <span className={`text-xs font-medium ${!studyMode ? 'text-primary' : 'text-muted-foreground'}`}>
                  מצב מבחן
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Split screen */}
        <div className={`max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 gap-5 ${fullText ? '' : 'lg:grid-cols-2'}`}>
          {/* Panel 1 — quiz / video */}
          <div className={`lg:order-2 ${fullText ? 'hidden' : ''}`}>
            <div className="bg-card rounded-2xl border border-border shadow-soft p-4 h-full">
              <Tabs defaultValue="quiz">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="quiz">חידון המילים</TabsTrigger>
                  <TabsTrigger value="video">סרטון הסבר</TabsTrigger>
                </TabsList>

                <TabsContent value="quiz" className="mt-4">
                  {!quiz.length ? (
                    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center">
                      <p className="font-semibold text-foreground">אין עדיין מילים מזוהות בדף זה 📝</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        החידון נבנה אוטומטית ממילות המילון שנמצאו בטקסט.
                      </p>
                    </div>
                  ) : finished ? (
                    <div className="text-center py-10">
                      <p className="text-4xl mb-3">{score === quiz.length ? '🏆' : '💪'}</p>
                      <p className="text-lg font-bold text-foreground">
                        {score} מתוך {quiz.length}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {score === quiz.length ? 'מושלם! שולט בדף הזה.' : 'עוד סיבוב וזה בכיס.'}
                      </p>
                      <button
                        onClick={() => { haptic(); resetQuiz(); }}
                        className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold shadow-soft"
                      >
                        <RotateCcw className="w-4 h-4" /> נסה שוב
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">
                          שאלה {qIndex + 1} מתוך {quiz.length}
                        </span>
                        <span className="text-xs font-bold text-primary">ניקוד: {score}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(qIndex / quiz.length) * 100}%` }}
                        />
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={qIndex}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="font-semibold text-foreground mb-4">{q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, i) => {
                              const isCorrect = i === q.correct;
                              const state =
                                picked === null
                                  ? 'idle'
                                  : isCorrect
                                    ? 'correct'
                                    : picked === i
                                      ? 'wrong'
                                      : 'dim';
                              return (
                                <button
                                  key={i}
                                  onClick={() => answer(i)}
                                  disabled={picked !== null}
                                  className={`w-full text-right rounded-xl border px-4 py-3 text-sm transition-all duration-300 flex items-center justify-between gap-2 ${
                                    state === 'idle'
                                      ? 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                                      : state === 'correct'
                                        ? 'border-primary bg-primary/10 text-foreground'
                                        : state === 'wrong'
                                          ? 'border-destructive bg-destructive/10 text-foreground'
                                          : 'border-border opacity-50'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {state === 'correct' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                                  {state === 'wrong' && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          {picked !== null && (
                            <div className="mt-4">
                              {q.explanation && (
                                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{q.explanation}</p>
                              )}
                              <button
                                onClick={() => { haptic(); next(); }}
                                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-soft"
                              >
                                {qIndex + 1 >= quiz.length ? 'סיום' : 'לשאלה הבאה'}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="mt-4">
                  {isDemo && berakhotAmud.videoUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden border border-border">
                      <iframe
                        src={berakhotAmud.videoUrl}
                        title={`סרטון הסבר — ${masechet.label} ${dafLabel} ${amudLabel}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Film className="w-7 h-7 text-primary" />
                      </div>
                      <p className="font-semibold text-foreground">סרטון הסבר לדף זה יעלה בקרוב! 🎬</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        בינתיים אפשר להתאמן בחידון המילים וללמוד מהטקסט האינטראקטיבי.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Panel 2 — Gemara text */}
          <div className="lg:order-1">
            <div className="bg-card rounded-2xl border border-border shadow-soft p-5 md:p-7 h-full">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {masechet.label} · {dafLabel} {amudLabel}
                </h2>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {studyMode ? 'מילות מפתח מסומנות' : 'רחף או לחץ לגילוי'}
                </span>
              </div>

              {loading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm">טוען את הדף...</p>
                </div>
              ) : loadError ? (
                <div className="py-14 text-center">
                  <AlertCircle className="w-7 h-7 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                </div>
              ) : (
                <>
                  <div className="text-justify">{renderText()}</div>
                  <p className="text-[11px] text-muted-foreground mt-6 border-t border-border pt-3">
                    זוהו {matchedWords.length} מילים ממילון האתר בדף זה.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Experiential;
