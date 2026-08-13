import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight, Plus, Copy, Users, FileText, ClipboardList, Check, ChevronDown, CheckCircle2, XCircle, TrendingUp, AlertTriangle, Settings as SettingsIcon, BookOpen, Clock, Trash2 } from 'lucide-react';
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
import { SHAS, dapimOf, findMasechet, gematria } from '@/data/shas';
import PageTransition from '@/components/PageTransition';
import PublicProfileDialog from '@/components/PublicProfileDialog';
import { sendPushTo } from '@/lib/push';

interface ClassRow { id: string; name: string; class_code: string; teacher_id: string; school_id?: string | null; forbidden_words?: string[]; }

const ClassTeacherTools = ({ classId, initialForbidden }: { classId: string; initialForbidden: string[] }) => {
  const [words, setWords] = useState(initialForbidden.join(', '));
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const saveWords = async () => {
    setSaving(true);
    const list = words.split(',').map((w) => w.trim()).filter(Boolean);
    const { error } = await supabase.from('classes').update({ forbidden_words: list }).eq('id', classId);
    setSaving(false);
    error ? toast.error('שגיאה בשמירה') : toast.success('המילים האסורות נשמרו');
  };

  const sendMail = async () => {
    if (!body.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from('class_mail').insert({
      class_id: classId, teacher_id: u.user.id, subject: subject.trim() || null, body: body.trim(),
    });
    if (error) { toast.error('שליחה נכשלה'); return; }
    toast.success('דואר נשלח לכיתה'); setSubject(''); setBody('');
    const { data: members } = await supabase.from('class_members').select('student_id').eq('class_id', classId);
    const ids = (members as { student_id: string }[] | null)?.map(m => m.student_id) || [];
    if (ids.length) sendPushTo(ids, `דואר חדש מהמורה ✉️`, (subject.trim() || body.trim()).slice(0, 120), '/inbox');
  };

  return (
    <div className="space-y-4">
      <section className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />מילים אסורות</h3>
        <p className="text-xs text-muted-foreground">הפרידו בפסיקים. הודעות עם מילים אלו ייחסמו והמורה יקבל התראה.</p>
        <Input value={words} onChange={(e) => setWords(e.target.value)} placeholder="לדוגמה: מילה1, מילה2" />
        <Button size="sm" onClick={saveWords} disabled={saving}>שמור</Button>
      </section>
      <section className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />שליחת דואר לכיתה</h3>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="כותרת (אופציונלי)" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="גוף ההודעה" className="w-full rounded-xl border border-border bg-background p-2 text-sm" />
        <Button size="sm" onClick={sendMail} disabled={!body.trim()}>שלח</Button>
      </section>
    </div>
  );
};

export interface GemaraQuestion { q: string; options: string[]; correct: number }
interface AssignmentSource { masechet?: string; daf?: string; amud?: string }
interface Assignment {
  id: string; title: string; type: string; word_ids: number[]; created_at: string;
  mode?: string | null; questions?: GemaraQuestion[] | null; source?: AssignmentSource | null;
}
interface Member { id: string; student_id: string; }
interface SubmissionDetail { word_id?: number; question_index?: number; correct: boolean }
interface Submission {
  id: string; assignment_id: string; student_id: string; score: number; total: number;
  details?: SubmissionDetail[] | null; duration_seconds?: number | null; submitted_at?: string;
}
interface ProfileLite { user_id: string; display_name: string | null; }

const fmtDuration = (sec?: number | null) => {
  if (!sec && sec !== 0) return null;
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${m}:${String(s).padStart(2, '0')} דק'` : `${s} שנ'`;
};

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dictionary } = useDictionary();

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'assignment' | 'test'>('assignment');
  const [mode, setMode] = useState<'vocab' | 'gemara'>('vocab');
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

  // Gemara builder state
  const [sederId, setSederId] = useState(SHAS[0].id);
  const [masechetId, setMasechetId] = useState(SHAS[0].masechtot[0].id);
  const [daf, setDaf] = useState('2');
  const [amud, setAmud] = useState<'a' | 'b'>('a');
  const [gq, setGq] = useState<GemaraQuestion[]>([{ q: '', options: ['', '', '', ''], correct: 0 }]);

  const { seder, masechet } = findMasechet(sederId, masechetId);
  const dapim = dapimOf(masechet);

  const wordMap = useMemo(() => {
    const m: Record<number, { aramaic: string; hebrew: string }> = {};
    dictionary.forEach((w) => { m[w.id] = { aramaic: w.aramaic, hebrew: w.hebrew }; });
    return m;
  }, [dictionary]);

  useEffect(() => { document.title = 'כיתה | לישנא'; }, []);

  const refresh = async () => {
    if (!id) return;
    const { data: c } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
    const cRow = c as ClassRow | null;
    setCls(cRow);

    let staff = false;
    if (cRow && user) {
      staff = cRow.teacher_id === user.id;
      if (!staff && cRow.school_id) {
        const { data: mem } = await supabase.from('school_members')
          .select('school_id').eq('user_id', user.id).eq('school_id', cRow.school_id).maybeSingle();
        staff = !!mem;
      }
    }
    setIsStaff(staff);

    const { data: a } = await supabase.from('assignments').select('*').eq('class_id', id).order('created_at', { ascending: false });
    const list = (a as unknown as Assignment[]) || [];
    setAssignments(list);
    const aIds = list.map((x) => x.id);

    if (staff) {
      const { data: m } = await supabase.from('class_members').select('*').eq('class_id', id);
      setMembers((m as Member[]) || []);
      const studentIds = ((m as Member[]) || []).map((x) => x.student_id);
      if (studentIds.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', studentIds);
        const map: Record<string, string> = {};
        (profs as ProfileLite[] || []).forEach((p) => { map[p.user_id] = p.display_name || 'תלמיד'; });
        setProfiles(map);
      }
      if (aIds.length) {
        const { data: subs } = await supabase.from('assignment_submissions').select('*').in('assignment_id', aIds);
        setSubmissions((subs as unknown as Submission[]) || []);
      } else setSubmissions([]);
    } else if (user && aIds.length) {
      const { data: subs } = await supabase.from('assignment_submissions').select('*').in('assignment_id', aIds).eq('student_id', user.id);
      setSubmissions((subs as unknown as Submission[]) || []);
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

  const validGemara = gq.filter((q) => q.q.trim() && q.options.every((o) => o.trim()));

  const createAssignment = async () => {
    if (!user || !cls || !title.trim()) { toast.error('נדרשת כותרת'); return; }
    if (mode === 'vocab' && selectedWords.size < 4) { toast.error('בחר לפחות 4 מילים'); return; }
    if (mode === 'gemara' && validGemara.length < 1) { toast.error('הוסף לפחות שאלה אחת מלאה'); return; }
    setBusy(true);
    const payload = {
      class_id: cls.id, teacher_id: user.id, title: title.trim(), type,
      mode,
      word_ids: mode === 'vocab' ? Array.from(selectedWords) : [],
      questions: mode === 'gemara' ? validGemara : [],
      source: mode === 'gemara'
        ? {
            masechet: masechet.label,
            daf: gematria(Number(daf)),
            amud: amud === 'a' ? 'ע"א' : 'ע"ב',
            sefaria: masechet.sefaria,
            dafNum: daf,
            amudId: amud,
          }
        : {},
      settings: { allowPowerUps, shuffleQuestions, timerEnabled, secondsPerQuestion, studyMode },

    };
    const { error } = await supabase.from('assignments').insert(payload as never);
    setBusy(false);
    if (error) { toast.error('שגיאה ביצירת המטלה'); return; }
    toast.success('המטלה נוצרה!');
    setCreateOpen(false); setTitle(''); setSelectedWords(new Set());
    setGq([{ q: '', options: ['', '', '', ''], correct: 0 }]);
    refresh();
  };

  const submissionsByAssignment = useMemo(() => {
    const map: Record<string, Submission[]> = {};
    submissions.forEach((s) => { (map[s.assignment_id] ||= []).push(s); });
    return map;
  }, [submissions]);

  const assignmentById = useMemo(() => {
    const m: Record<string, Assignment> = {};
    assignments.forEach((a) => { m[a.id] = a; });
    return m;
  }, [assignments]);

  /** Per-student cumulative average across the class */
  const studentStats = useMemo(() => {
    const acc: Record<string, { sum: number; n: number; time: number }> = {};
    submissions.forEach((s) => {
      if (!s.total) return;
      (acc[s.student_id] ||= { sum: 0, n: 0, time: 0 });
      acc[s.student_id].sum += (s.score / s.total) * 100;
      acc[s.student_id].n += 1;
      acc[s.student_id].time += s.duration_seconds || 0;
    });
    return Object.entries(acc)
      .map(([sid, v]) => ({ sid, avg: Math.round(v.sum / v.n), count: v.n, time: v.time }))
      .sort((a, b) => b.avg - a.avg);
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
          <p className="text-xs text-muted-foreground">{isStaff ? 'ממשק מורה' : 'ממשק תלמיד'}</p>
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

        {/* Student personal summary */}
        {!isStaff && submissions.length > 0 && (() => {
          const avg = Math.round(submissions.reduce((a, s) => a + (s.total ? (s.score / s.total) * 100 : 0), 0) / submissions.length);
          return (
            <div className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">הממוצע שלי בכיתה זו</p>
                <p className="text-3xl font-bold text-primary mt-1">{avg}</p>
                <p className="text-xs text-muted-foreground mt-1">{submissions.length} מתוך {assignments.length} מטלות הושלמו</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          );
        })()}

        {/* Teacher analytics */}
        {isStaff && submissions.length > 0 && (() => {
          const grades = submissions.filter((s) => s.total > 0).map((s) => (s.score / s.total) * 100);
          const classAvg = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
          const wrongWords: Record<number, number> = {};
          const wrongQuestions: Record<string, number> = {};
          submissions.forEach((s) => {
            const a = assignmentById[s.assignment_id];
            (s.details || []).forEach((d) => {
              if (d.correct) return;
              if (typeof d.word_id === 'number') wrongWords[d.word_id] = (wrongWords[d.word_id] || 0) + 1;
              else if (typeof d.question_index === 'number') {
                const text = a?.questions?.[d.question_index]?.q || `שאלה ${d.question_index + 1}`;
                const k = `${a?.title || ''}|${text}`;
                wrongQuestions[k] = (wrongQuestions[k] || 0) + 1;
              }
            });
          });
          const difficult = Object.entries(wrongWords).map(([wid, c]) => ({ wid: Number(wid), count: c }))
            .sort((a, b) => b.count - a.count).slice(0, 5);
          const hardQs = Object.entries(wrongQuestions).map(([k, c]) => ({ k, count: c }))
            .sort((a, b) => b.count - a.count).slice(0, 5);
          const maxWrong = difficult[0]?.count || 1;
          const maxQ = hardQs[0]?.count || 1;
          return (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />ממוצע כיתתי</p>
                <p className="text-3xl font-bold text-primary mt-1">{classAvg}</p>
                <p className="text-xs text-muted-foreground mt-1">{submissions.length} הגשות · {members.length} תלמידים</p>
              </div>

              {studentStats.length > 0 && (
                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />ממוצע לפי תלמיד</h3>
                  <ul className="divide-y divide-border">
                    {studentStats.map((st) => (
                      <li key={st.sid}>
                        <button onClick={() => setProfileUserId(st.sid)} className="w-full flex items-center justify-between py-2 text-sm hover:bg-muted/40 rounded px-2">
                          <span className="truncate">{profiles[st.sid] || 'תלמיד'}</span>
                          <span className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted-foreground">{st.count} מטלות</span>
                            <span className={`font-bold ${st.avg >= 90 ? 'text-green-600 dark:text-green-400' : st.avg < 60 ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>{st.avg}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

              {hardQs.length > 0 && (
                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-500" />שאלות גמרא מאתגרות</h3>
                  <div className="space-y-2">
                    {hardQs.map(({ k, count }) => {
                      const [aTitle, qText] = k.split('|');
                      return (
                        <div key={k}>
                          <div className="flex justify-between text-sm mb-1 gap-2">
                            <span className="truncate">{qText}<span className="text-muted-foreground text-xs mr-2">({aTitle})</span></span>
                            <span className="text-xs text-muted-foreground shrink-0">{count} טעויות</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxQ) * 100}%` }} transition={{ duration: 0.6 }} className="h-full bg-gradient-to-l from-amber-500 to-red-500" />
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
            {isStaff && <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 ml-1" />חדש</Button>}
          </div>
          {assignments.length === 0 ? <p className="text-sm text-muted-foreground">אין מטלות עדיין</p> :
            <div className="space-y-3">
              {assignments.map((a) => {
                const subs = submissionsByAssignment[a.id] || [];
                const myDone = !isStaff && subs.length > 0;
                const isGemara = a.mode === 'gemara';
                const count = isGemara ? (a.questions?.length || 0) : a.word_ids.length;
                return (
                  <div key={a.id} className="bg-card rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {isGemara ? <BookOpen className="w-5 h-5 text-primary shrink-0" /> :
                          a.type === 'test' ? <ClipboardList className="w-5 h-5 text-primary shrink-0" /> : <FileText className="w-5 h-5 text-primary shrink-0" />}
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{a.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {count} {isGemara ? 'שאלות' : 'מילים'} · {a.type === 'test' ? 'מבחן' : 'מטלה'}
                            {isGemara && a.source?.masechet ? ` · ${a.source.masechet} ${a.source.daf || ''} ${a.source.amud || ''}` : ''}
                          </p>
                        </div>
                      </div>
                      {!isStaff && (
                        myDone ? (
                          <div className="text-left shrink-0">
                            <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full font-semibold">
                              ציון {Math.round((subs[0].score / subs[0].total) * 100)} · {subs[0].score}/{subs[0].total}
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {subs[0].submitted_at ? new Date(subs[0].submitted_at).toLocaleDateString('he-IL') : ''}
                              {fmtDuration(subs[0].duration_seconds) ? ` · ${fmtDuration(subs[0].duration_seconds)}` : ''}
                            </p>
                          </div>
                        ) : (
                          <Button asChild size="sm">
                            <Link to={`/assignment/${a.id}`}>התחל</Link>
                          </Button>
                        )
                      )}
                    </div>
                    {isStaff && (
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
                                    className="w-full flex justify-between items-center py-1.5 hover:bg-muted/50 rounded px-2 transition-colors gap-2"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.stopPropagation(); setProfileUserId(s.student_id); }}
                                        className="hover:text-primary hover:underline cursor-pointer truncate"
                                      >
                                        {profiles[s.student_id] || 'תלמיד'}
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-2 shrink-0">
                                      {fmtDuration(s.duration_seconds) && (
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                          <Clock className="w-3 h-3" />{fmtDuration(s.duration_seconds)}
                                        </span>
                                      )}
                                      <span className="font-semibold text-primary">ציון {grade} · {s.score}/{s.total}</span>
                                    </span>
                                  </button>
                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="px-2 py-2 space-y-1">
                                          {s.submitted_at && (
                                            <p className="text-[11px] text-muted-foreground">
                                              הוגש ב-{new Date(s.submitted_at).toLocaleString('he-IL')}
                                            </p>
                                          )}
                                          {details.length === 0 ? <p className="text-xs text-muted-foreground">אין פירוט זמין</p> :
                                            details.map((d, i) => {
                                              if (typeof d.question_index === 'number') {
                                                const qt = a.questions?.[d.question_index]?.q || `שאלה ${d.question_index + 1}`;
                                                return (
                                                  <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1">
                                                    {d.correct ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                                                    <span className="truncate">{qt}</span>
                                                  </div>
                                                );
                                              }
                                              const w = wordMap[d.word_id as number];
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
        {isStaff && (
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Users className="w-5 h-5" />תלמידים ({members.length})</h2>
            {members.length === 0 ? <p className="text-sm text-muted-foreground">עדיין לא הצטרפו תלמידים</p> :
              <div className="bg-card rounded-2xl border border-border divide-y divide-border">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setProfileUserId(m.student_id)}
                    className="w-full text-right px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    {profiles[m.student_id] || 'תלמיד'}
                  </button>
                ))}
              </div>
            }
          </section>
        )}

        {isStaff && cls && (
          <ClassTeacherTools classId={cls.id} initialForbidden={cls.forbidden_words || []} />
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

            <div className="flex gap-2">
              {([['vocab', 'אוצר מילים'], ['gemara', 'דף גמרא']] as const).map(([mv, label]) => (
                <button key={mv} onClick={() => setMode(mv)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${mode === mv ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}>
                  {label}
                </button>
              ))}
            </div>

            {mode === 'vocab' ? (
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
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select value={sederId} onChange={(e) => { const s = SHAS.find((x) => x.id === e.target.value)!; setSederId(s.id); setMasechetId(s.masechtot[0].id); setDaf('2'); }}
                    className="rounded-lg border border-border bg-background p-2 text-sm">
                    {SHAS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <select value={masechetId} onChange={(e) => { setMasechetId(e.target.value); setDaf('2'); }}
                    className="rounded-lg border border-border bg-background p-2 text-sm">
                    {seder.masechtot.map((mm) => <option key={mm.id} value={mm.id}>{mm.label}</option>)}
                  </select>
                  <select value={daf} onChange={(e) => setDaf(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm">
                    {dapim.length === 0 ? <option value="2">אין דפים</option> : dapim.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                  <select value={amud} onChange={(e) => setAmud(e.target.value as 'a' | 'b')} className="rounded-lg border border-border bg-background p-2 text-sm">
                    <option value="a">עמוד א</option>
                    <option value="b">עמוד ב</option>
                  </select>
                </div>

                <p className="text-sm font-semibold">שאלות על הדף ({validGemara.length} מוכנות)</p>
                {gq.map((q, qi) => (
                  <div key={qi} className="border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={q.q} placeholder={`שאלה ${qi + 1}`}
                        onChange={(e) => setGq((prev) => prev.map((x, i) => i === qi ? { ...x, q: e.target.value } : x))} />
                      {gq.length > 1 && (
                        <button onClick={() => setGq((prev) => prev.filter((_, i) => i !== qi))} className="p-2 text-muted-foreground hover:text-destructive" aria-label="מחק שאלה">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={q.correct === oi}
                          onChange={() => setGq((prev) => prev.map((x, i) => i === qi ? { ...x, correct: oi } : x))} />
                        <Input value={opt} placeholder={`תשובה ${oi + 1}`}
                          onChange={(e) => setGq((prev) => prev.map((x, i) => i === qi
                            ? { ...x, options: x.options.map((o, j) => j === oi ? e.target.value : o) } : x))} />
                      </label>
                    ))}
                    <p className="text-[11px] text-muted-foreground">סמן את העיגול ליד התשובה הנכונה</p>
                  </div>
                ))}
                <Button variant="outline" size="sm" type="button"
                  onClick={() => setGq((p) => [...p, { q: '', options: ['', '', '', ''], correct: 0 }])}>
                  <Plus className="w-4 h-4 ml-1" />הוסף שאלה
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(true)} type="button" className="flex-shrink-0">
                <SettingsIcon className="w-4 h-4 ml-1" />הגדרות
              </Button>
              <Button onClick={createAssignment} disabled={busy || !title.trim()} className="flex-1">צור מטלה</Button>
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

      <PublicProfileDialog
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(o) => !o && setProfileUserId(null)}
      />
    </div>
    </PageTransition>
  );
};

export default ClassDetail;
