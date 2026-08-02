import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Volume2, Star, Sparkles, Film, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';
import Footer from '@/components/Footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SEDARIM, type GlossWord } from '@/data/experiential';
import { removeNiqqud, useDictionary } from '@/contexts/DictionaryContext';
import { useUserWords } from '@/hooks/useUserWords';
import { useAuth } from '@/contexts/AuthContext';
import { isAudioEnabled, sfxCorrect, sfxIncorrect } from '@/lib/audio';
import { haptic } from '@/lib/haptics';

const PERSONAL_KEY = 'lishna:personal-dict';

const speak = (word: string) => {
  if (!isAudioEnabled()) {
    toast.info('השמע כבוי בהגדרות');
    return;
  }
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'he-IL';
    u.rate = 0.85;
    synth.speak(u);
  } catch {
    /* noop */
  }
};

const WordChip = ({
  gloss,
  studyMode,
  onSave,
  saved,
}: {
  gloss: GlossWord;
  studyMode: boolean;
  onSave: (g: GlossWord) => void;
  saved: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          aria-label={`${gloss.word} — ${gloss.hebrew}`}
          className={`rounded-md px-0.5 -mx-0.5 transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            studyMode
              ? 'bg-yellow-100 dark:bg-yellow-500/25 decoration-primary/40 underline decoration-dotted underline-offset-4'
              : 'hover:bg-yellow-100 dark:hover:bg-yellow-500/25'
          }`}
        >
          {gloss.word}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-64 text-right"
      >
        <p className="font-display text-lg font-bold text-foreground">{gloss.word}</p>
        <p className="text-primary font-semibold text-sm mt-0.5">{gloss.hebrew}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{gloss.context}</p>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => speak(gloss.word)}
            className="flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 hover:bg-secondary/70 transition-colors"
            aria-label="השמעת המילה"
          >
            <Volume2 className="w-3.5 h-3.5" /> השמע
          </button>
          <button
            onClick={() => onSave(gloss)}
            className={`flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
              saved
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground hover:bg-accent/70'
            }`}
            aria-label="שמור למילון אישי"
          >
            <Star className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            {saved ? 'נשמר' : 'שמור'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Experiential = () => {
  const { user } = useAuth();
  const { dictionary } = useDictionary();
  const { markWordAsLearned } = useUserWords();

  const [sederId, setSederId] = useState(SEDARIM[0].id);
  const seder = SEDARIM.find((s) => s.id === sederId) ?? SEDARIM[0];

  const [masechetId, setMasechetId] = useState(seder.masechtot[0].id);
  const masechet = seder.masechtot.find((m) => m.id === masechetId) ?? seder.masechtot[0];

  const [dafId, setDafId] = useState(masechet.dapim[0].id);
  const daf = masechet.dapim.find((d) => d.id === dafId) ?? masechet.dapim[0];

  const [amudId, setAmudId] = useState(daf.amudim[0].id);
  const amud = daf.amudim.find((a) => a.id === amudId) ?? daf.amudim[0];

  const [studyMode, setStudyMode] = useState(true);
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PERSONAL_KEY) || '[]').map((w: GlossWord) => w.word);
    } catch {
      return [];
    }
  });

  // Keep the cascading selectors valid
  useEffect(() => {
    if (!seder.masechtot.some((m) => m.id === masechetId)) setMasechetId(seder.masechtot[0].id);
  }, [sederId]);
  useEffect(() => {
    if (!masechet.dapim.some((d) => d.id === dafId)) setDafId(masechet.dapim[0].id);
  }, [masechetId]);
  useEffect(() => {
    if (!daf.amudim.some((a) => a.id === amudId)) setAmudId(daf.amudim[0].id);
  }, [dafId]);

  // Quiz state
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
  useEffect(resetQuiz, [sederId, masechetId, dafId, amudId]);

  const glossMap = useMemo(() => {
    const map = new Map<string, GlossWord>();
    amud.glossary.forEach((g) => map.set(g.word, g));
    return map;
  }, [amud]);

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

    // If the word exists in the main dictionary — mark it as learned for the account too
    const match = dictionary.find(
      (w) => removeNiqqud(w.aramaic) === removeNiqqud(g.word)
    );
    if (user && match) await markWordAsLearned(match.id);
    toast.success(`"${g.word}" נשמרה למילון האישי ⭐`);
  };

  const answer = (i: number) => {
    if (picked !== null) return;
    haptic();
    setPicked(i);
    const q = amud.quiz[qIndex];
    if (i === q.correct) {
      setScore((s) => s + 1);
      sfxCorrect();
    } else {
      sfxIncorrect();
    }
  };

  const next = () => {
    if (qIndex + 1 >= amud.quiz.length) setFinished(true);
    else {
      setQIndex((i) => i + 1);
      setPicked(null);
    }
  };

  const renderText = () =>
    amud.text.split('\n').map((line, li) => (
      <p key={li} className="mb-4 leading-[2.2] text-lg md:text-xl font-display text-foreground">
        {line.split(/(\[\[[^\]]+\]\])/g).map((part, pi) => {
          const m = part.match(/^\[\[([^\]]+)\]\]$/);
          if (!m) return <span key={pi}>{part}</span>;
          const g = glossMap.get(m[1]) ?? { word: m[1], hebrew: '', context: '' };
          return (
            <WordChip
              key={pi}
              gloss={g}
              studyMode={studyMode}
              onSave={saveWord}
              saved={saved.includes(g.word)}
            />
          );
        })}
      </p>
    ));

  const q = amud.quiz[qIndex];

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
                  {seder.label} · {masechet.label} · {daf.label} {amud.label}
                </p>
              </div>
            </div>

            {/* Selectors + mode toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sederId} onValueChange={setSederId}>
                <SelectTrigger className="w-[150px] bg-card" aria-label="סדר">
                  <SelectValue placeholder="סדר" />
                </SelectTrigger>
                <SelectContent>
                  {SEDARIM.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={masechetId} onValueChange={setMasechetId}>
                <SelectTrigger className="w-[150px] bg-card" aria-label="מסכת">
                  <SelectValue placeholder="מסכת" />
                </SelectTrigger>
                <SelectContent>
                  {seder.masechtot.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dafId} onValueChange={setDafId}>
                <SelectTrigger className="w-[110px] bg-card" aria-label="דף">
                  <SelectValue placeholder="דף" />
                </SelectTrigger>
                <SelectContent>
                  {masechet.dapim.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={amudId} onValueChange={(v) => setAmudId(v as 'a' | 'b')}>
                <SelectTrigger className="w-[110px] bg-card" aria-label="עמוד">
                  <SelectValue placeholder="עמוד" />
                </SelectTrigger>
                <SelectContent>
                  {daf.amudim.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Panel 1 — quiz / video (left on desktop = second in RTL grid order) */}
          <div className="lg:order-2">
            <div className="bg-card rounded-2xl border border-border shadow-soft p-4 h-full">
              <Tabs defaultValue="quiz">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="quiz">חידון המילים</TabsTrigger>
                  <TabsTrigger value="video">סרטון הסבר</TabsTrigger>
                </TabsList>

                <TabsContent value="quiz" className="mt-4">
                  {finished ? (
                    <div className="text-center py-10">
                      <p className="text-4xl mb-3">{score === amud.quiz.length ? '🏆' : '💪'}</p>
                      <p className="text-lg font-bold text-foreground">
                        {score} מתוך {amud.quiz.length}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {score === amud.quiz.length ? 'מושלם! שולט בדף הזה.' : 'עוד סיבוב וזה בכיס.'}
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
                          שאלה {qIndex + 1} מתוך {amud.quiz.length}
                        </span>
                        <span className="text-xs font-bold text-primary">ניקוד: {score}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(qIndex / amud.quiz.length) * 100}%` }}
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
                                {qIndex + 1 >= amud.quiz.length ? 'סיום' : 'לשאלה הבאה'}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="mt-4">
                  {amud.videoUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden border border-border">
                      <iframe
                        src={amud.videoUrl}
                        title={`סרטון הסבר — ${masechet.label} ${daf.label} ${amud.label}`}
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

          {/* Panel 2 — Gemara text (right on desktop) */}
          <div className="lg:order-1">
            <div className="bg-card rounded-2xl border border-border shadow-soft p-5 md:p-7 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {masechet.label} · {daf.label} {amud.label}
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  {studyMode ? 'מילות מפתח מסומנות' : 'רחף או לחץ לגילוי'}
                </span>
              </div>
              <div className="text-justify">{renderText()}</div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Experiential;
