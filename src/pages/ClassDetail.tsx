import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight, Plus, Copy, Users, FileText, ClipboardList, Check, ChevronDown, CheckCircle2, XCircle, TrendingUp, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDictionary, removeNiqqud } from '@/contexts/DictionaryContext';
import PageTransition from '@/components/PageTransition';
import PublicProfileDialog from '@/components/PublicProfileDialog';

interface ClassRow { id: string; name: string; class_code: string; teacher_id: string; }
interface Assignment { id: string; title: string; type: string; word_ids: number[]; created_at: string; }
interface Member { id: string; student_id: string; }
interface SubmissionDetail { word_id: number; correct: boolean }
interface Submission { id: string; assignment_id: string; student_id: string; score: number; total: number; details?: SubmissionDetail[] | null; }
interface ProfileLite { user_id: string; display_name: string | null; }

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dictionary } = useDictionary();

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'assignment' | 'test'>('assignment');
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wordSearch, setWordSearch] = useState('');
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allowPowerUps, setAllowPowerUps] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(20);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const wordMap = useMemo(() => {
    const m: Record<number, { aramaic: string; hebrew: string }> = {};
    dictionary.forEach((w) => { m[w.id] = { aramaic: w.aramaic, hebrew: w.hebrew }; });
    return m;
  }, [dictionary]);

  const isTeacher = !!user && !!cls && cls.teacher_id === user.id;

  useEffect(() => { document.title = 'כיתה | לישנא'; }, []);

  const refresh = async () => {
    if (!id) return;
    const { data: c } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
    setCls(c as ClassRow | null);
    const { data: a } = await supabase.from('assignments').select('*').eq('class_id', id).order('created_at', { ascending: false });
    setAssignments((a as Assignment[]) || []);
    if (c && user && (c as ClassRow).teacher_id === user.id) {
      const { data: m } = await supabase.from('class_members').select('*').eq('class_id', id);
      setMembers((m as Member[]) || []);
      const studentIds = ((m as Member[]) || []).map((x) => x.student_id);
      if (studentIds.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', studentIds);
        const map: Record<string, string> = {};
        (profs as ProfileLite[] || []).forEach((p) => { map[p.user_id] = p.display_name || 'תלמיד'; });
        setProfiles(map);
      }
      const aIds = ((a as Assignment[]) || []).map((x) => x.id);
      if (aIds.length) {
        const { data: subs } = await supabase.from('assignment_submissions').select('*').in('assignment_id', aIds);
        setSubmissions((subs as unknown as Submission[]) || []);
      }
    } else if (user) {
      // student: load their own submissions for these assignments
      const aIds = ((a as Assignment[]) || []).map((x) => x.id);
      if (aIds.length) {
        const { data: subs } = await supabase.from('assignment_submissions').select('*').in('assignment_id', aIds).eq('student_id', user.id);
        setSubmissions((subs as unknown as Submission[]) || []);
      }
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id, user?.id]);

  const copyCode = async () => {
    if (!cls) return;
    await navigator.clipboard.writeText(cls.class_code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    toast.success('קוד הועתק');
  };

  const toggleWord = (wid: number) => {
    setSelectedWords((s) => {
      const next = new Set(s);
      if (next.has(wid)) next.delete(wid); else next.add(wid);
      return next;
    });
  };

  const createAssignment = async () => {
    if (!user || !cls || !title.trim() || selectedWords.size < 4) {
      toast.error('כותרת ולפחות 4 מילים נדרשים');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('assignments').insert({
      class_id: cls.id, teacher_id: user.id, title: title.trim(), type, word_ids: Array.from(selectedWords),
      settings: { allowPowerUps, shuffleQuestions, timerEnabled, secondsPerQuestion },
    });
    setBusy(false);
    if (error) { toast.error('שגיאה'); return; }
    toast.success('המטלה נוצרה!');
    setCreateOpen(false); setTitle(''); setSelectedWords(new Set());
    refresh();
  };

  const submissionsByAssignment = useMemo(() => {
    const map: Record<string, Submission[]> = {};
    submissions.forEach((s) => { (map[s.assignment_id] ||= []).push(s); });
    return map;
  }, [submissions]);

  if (!cls) {
    return <div className="min-h-screen bg-background pb-24 flex items-center justify-center">טוען...</div>;
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/classes')} className="p-2 rounded-full hover:bg-muted" aria-label="חזור">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{cls.name}</h1>
          <p className="text-xs text-muted-foreground">{isTeacher ? 'ממשק מורה' : 'ממשק תלמיד'}</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        {/* Class code */}
        <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">קוד הכיתה</p>
            <p className="text-2xl font-mono font-bold text-primary tracking-wider" role="status">{cls.class_code}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyCode} aria-label="העתק קוד">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Teacher analytics */}
        {isTeacher && submissions.length > 0 && (() => {
          const grades = submissions.filter((s) => s.total > 0).map((s) => (s.score / s.total) * 100);
          const classAvg = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
          const wrongCount: Record<number, number> = {};
          submissions.forEach((s) => {
            (s.details || []).forEach((d) => {
              if (!d.correct) wrongCount[d.word_id] = (wrongCount[d.word_id] || 0) + 1;
            });
          });
          const difficult = Object.entries(wrongCount)
            .map(([wid, c]) => ({ wid: Number(wid), count: c }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          const maxWrong = difficult[0]?.count || 1;
          return (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />ממוצע כיתתי</p>
                  <p className="text-3xl font-bold text-primary mt-1">{classAvg}</p>
                  <p className="text-xs text-muted-foreground mt-1">{submissions.length} הגשות</p>
                </div>
              </div>
              {difficult.length > 0 && (
                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />מילים מאתגרות</h3>
                  <div className="space-y-2">
                    {difficult.map(({ wid, count }) => {
                      const w = wordMap[wid];
                      const pct = (count / maxWrong) * 100;
                      return (
                        <div key={wid}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-display font-semibold">{w?.aramaic || `#${wid}`}<span className="text-muted-foreground font-sans font-normal mr-2">— {w?.hebrew || ''}</span></span>
                            <span className="text-xs text-muted-foreground">{count} טעויות</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full bg-gradient-to-l from-amber-500 to-red-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.section>
          );
        })()}

        {/* Assignments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">מטלות</h2>
            {isTeacher && <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 ml-1" />חדש</Button>}
          </div>
          {assignments.length === 0 ? <p className="text-sm text-muted-foreground">אין מטלות עדיין</p> :
            <div className="space-y-3">
              {assignments.map((a) => {
                const subs = submissionsByAssignment[a.id] || [];
                const myDone = !isTeacher && subs.length > 0;
                return (
                  <div key={a.id} className="bg-card rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {a.type === 'test' ? <ClipboardList className="w-5 h-5 text-primary shrink-0" /> : <FileText className="w-5 h-5 text-primary shrink-0" />}
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{a.title}</h3>
                          <p className="text-xs text-muted-foreground">{a.word_ids.length} מילים · {a.type === 'test' ? 'מבחן' : 'מטלה'}</p>
                        </div>
                      </div>
                      {!isTeacher && (
                        myDone ? (
                          <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full font-semibold">
                            ציון {Math.round((subs[0].score / subs[0].total) * 100)} · {subs[0].score}/{subs[0].total}
                          </span>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/assignment/${a.id}`}>התחל</Link>
                          </Button>
                        )
                      )}
                    </div>
                    {isTeacher && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">תוצאות ({subs.length}/{members.length}):</p>
                        {subs.length === 0 ? <p className="text-xs text-muted-foreground">אף תלמיד לא סיים עדיין</p> :
                          <ul className="space-y-1">
                            {subs.map((s) => {
                              const grade = s.total ? Math.round((s.score / s.total) * 100) : 0;
                              const isOpen = expandedSub === s.id;
                              const details = Array.isArray(s.details) ? s.details : [];
                              return (
                                <li key={s.id} className="text-sm">
                                  <button
                                    onClick={() => setExpandedSub(isOpen ? null : s.id)}
                                    className="w-full flex justify-between items-center py-1.5 hover:bg-muted/50 rounded px-2 transition-colors"
                                  >
                                    <span className="flex items-center gap-2">
                                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.stopPropagation(); setProfileUserId(s.student_id); }}
                                        className="hover:text-primary hover:underline cursor-pointer"
                                      >
                                        {profiles[s.student_id] || 'תלמיד'}
                                      </span>
                                    </span>
                                    <span className="font-semibold text-primary">ציון {grade} · {s.score}/{s.total}</span>
                                  </button>
                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="px-2 py-2 space-y-1">
                                          {details.length === 0 ? <p className="text-xs text-muted-foreground">אין פירוט זמין</p> :
                                            details.map((d, i) => {
                                              const w = wordMap[d.word_id];
                                              return (
                                                <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1">
                                                  {d.correct ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                                                  <span className="font-display font-semibold">{w?.aramaic || `#${d.word_id}`}</span>
                                                  <span className="text-muted-foreground">— {w?.hebrew || ''}</span>
                                                </div>
                                              );
                                            })
                                          }
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </li>
                              );
                            })}
                          </ul>
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          }
        </section>

        {/* Teacher members list */}
        {isTeacher && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5" />תלמידים ({members.length})</h2>
            {members.length === 0 ? <p className="text-sm text-muted-foreground">עדיין לא הצטרפו תלמידים</p> :
              <div className="bg-card rounded-2xl border border-border divide-y divide-border">
                {members.map((m) => (
                  <div key={m.id} className="px-4 py-3">{profiles[m.student_id] || 'תלמיד'}</div>
                ))}
              </div>
            }
          </section>
        )}
      </div>

      {/* Create assignment dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>מטלה חדשה</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת" />
            <div className="flex gap-2">
              {(['assignment', 'test'] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}>
                  {t === 'test' ? 'מבחן' : 'מטלה'}
                </button>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">בחר מילים מתוך {dictionary.length} ({selectedWords.size} נבחרו, מינימום 4)</p>
              <Input
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
                placeholder="חיפוש מילה בארמית או בעברית..."
                className="mb-2"
              />
              <div className="border border-border rounded-lg max-h-72 overflow-y-auto divide-y divide-border">
                {(() => {
                  const q = removeNiqqud(wordSearch.trim().toLowerCase());
                  const list = q
                    ? dictionary.filter((w) =>
                        removeNiqqud(w.aramaic.toLowerCase()).includes(q) ||
                        removeNiqqud(w.hebrew.toLowerCase()).includes(q)
                      )
                    : dictionary;
                  if (list.length === 0) return <p className="text-xs text-muted-foreground p-3 text-center">לא נמצאו מילים</p>;
                  return list.map((w) => (
                    <label key={w.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox checked={selectedWords.has(w.id)} onCheckedChange={() => toggleWord(w.id)} />
                      <div className="flex-1 flex justify-between text-sm">
                        <span className="font-display">{w.aramaic}</span>
                        <span className="text-muted-foreground">{w.hebrew}</span>
                      </div>
                    </label>
                  ));
                })()}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(true)} type="button" className="flex-shrink-0">
                <SettingsIcon className="w-4 h-4 ml-1" />הגדרות
              </Button>
              <Button onClick={createAssignment} disabled={busy || !title.trim() || selectedWords.size < 4} className="flex-1">צור מטלה</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>הגדרות מטלה</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <label className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/40">
              <div className="text-right">
                <p className="font-semibold text-foreground">כוחות מיוחדים</p>
                <p className="text-xs text-muted-foreground">אפשר/חסום שימוש ב-50:50 ובמכפילים במהלך המטלה</p>
              </div>
              <Switch checked={allowPowerUps} onCheckedChange={setAllowPowerUps} />
            </label>

            <label className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/40">
              <div className="text-right">
                <p className="font-semibold text-foreground">ערבוב שאלות</p>
                <p className="text-xs text-muted-foreground">סדר השאלות יוגרל לכל תלמיד בנפרד</p>
              </div>
              <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
            </label>

            <div className="p-3 rounded-xl bg-muted/40">
              <label className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="font-semibold text-foreground">טיימר לשאלה</p>
                  <p className="text-xs text-muted-foreground">ספירה לאחור לכל שאלה</p>
                </div>
                <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
              </label>
              {timerEnabled && (
                <div className="mt-3 flex items-center gap-2 justify-end">
                  <span className="text-sm text-muted-foreground">שניות לשאלה:</span>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={secondsPerQuestion}
                    onChange={(e) => setSecondsPerQuestion(Math.max(5, Math.min(120, Number(e.target.value) || 20)))}
                    className="w-24"
                  />
                </div>
              )}
            </div>

            <Button className="w-full" onClick={() => setSettingsOpen(false)}>שמור הגדרות</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default ClassDetail;
