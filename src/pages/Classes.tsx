import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, GraduationCap, LogIn, KeyRound, Trophy, School as SchoolIcon, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateClassCode } from '@/lib/classCode';
import {
  SchoolInfo, SCHOOL_CODES, MAX_CLASSES_PER_SCHOOL, MAX_STUDENTS_PER_CLASS,
  getSchoolSession, setSchoolSession, clearSchoolSession,
} from '@/lib/schoolSession';
import PageTransition from '@/components/PageTransition';

interface ClassRow { id: string; name: string; class_code: string; teacher_id: string; school_id?: string | null; }

const Classes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [schoolClasses, setSchoolClasses] = useState<ClassRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [joined, setJoined] = useState<ClassRow[]>([]);
  const [classAvg, setClassAvg] = useState<Record<string, { avg: number; count: number }>>({});
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  // School login dialog
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [step, setStep] = useState<'code' | 'name'>('code');
  const [codeInput, setCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [codeErr, setCodeErr] = useState('');

  useEffect(() => { document.title = 'ביה"ס שלי | לישנא'; }, []);

  const loadSchoolSpace = async (info: SchoolInfo) => {
    const { data: cls } = await supabase
      .from('classes').select('*').eq('school_id', info.id).order('created_at', { ascending: true });
    const list = (cls as ClassRow[]) || [];
    setSchoolClasses(list);
    if (list.length) {
      const { data: mem } = await supabase.from('class_members').select('class_id').in('class_id', list.map((c) => c.id));
      const map: Record<string, number> = {};
      ((mem as { class_id: string }[]) || []).forEach((m) => { map[m.class_id] = (map[m.class_id] || 0) + 1; });
      setCounts(map);
    } else setCounts({});
  };

  const refresh = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Resolve school membership (server is the source of truth, local cache keeps the session)
    const { data: mem } = await supabase.from('school_members').select('school_id').eq('user_id', user.id).maybeSingle();
    let info: SchoolInfo | null = null;
    if (mem?.school_id) {
      const { data: s } = await supabase.from('schools').select('id, name, school_code').eq('id', mem.school_id).maybeSingle();
      if (s) {
        const cached = getSchoolSession(user.id);
        info = { id: s.id, name: s.name, code: s.school_code, teacherName: cached?.teacherName };
        setSchoolSession(user.id, info);
      }
    } else {
      clearSchoolSession(user.id);
    }
    setSchool(info);
    if (info) await loadSchoolSpace(info);
    else { setSchoolClasses([]); setCounts({}); }

    // Student side
    const [{ data: members }, { data: subs }] = await Promise.all([
      supabase.from('class_members').select('class_id, classes(*)').eq('student_id', user.id),
      supabase.from('assignment_submissions').select('score, total, assignments!inner(class_id)').eq('student_id', user.id),
    ]);
    setJoined(((members as { classes: ClassRow }[]) || []).map((m) => m.classes).filter(Boolean));
    const list = (subs as { score: number; total: number; assignments: { class_id: string } | null }[] | null) || [];
    const acc: Record<string, { sum: number; n: number }> = {};
    list.forEach((s) => {
      const cid = s.assignments?.class_id;
      if (!cid || !s.total) return;
      (acc[cid] ||= { sum: 0, n: 0 });
      acc[cid].sum += (s.score / s.total) * 100;
      acc[cid].n += 1;
    });
    const avgMap: Record<string, { avg: number; count: number }> = {};
    Object.entries(acc).forEach(([cid, v]) => { avgMap[cid] = { avg: Math.round(v.sum / v.n), count: v.n }; });
    setClassAvg(avgMap);
    setLoading(false);
  };

  useEffect(() => {
    // Optimistic hydration from the remembered session so refreshes don't flash the code screen
    if (user) setSchool(getSchoolSession(user.id));
    refresh();
    /* eslint-disable-next-line */
  }, [user?.id]);

  const myAverage = (() => {
    const vals = Object.values(classAvg);
    if (!vals.length) return null;
    const totalTasks = vals.reduce((a, b) => a + b.count, 0);
    const weighted = vals.reduce((a, b) => a + b.avg * b.count, 0);
    return { avg: Math.round(weighted / totalTasks), count: totalTasks };
  })();

  const handleCodeStep = () => {
    const code = codeInput.trim();
    if (!SCHOOL_CODES[code]) { setCodeErr('קוד בית ספר שגוי. אנא פנה לצוות לישנא'); return; }
    setCodeErr('');
    setStep('name');
  };

  const handleSchoolJoin = async () => {
    if (!user || !nameInput.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('join_school_by_code', {
      _code: codeInput.trim(), _name: nameInput.trim(),
    });
    setBusy(false);
    const res = data as { error?: string; id?: string; name?: string; code?: string } | null;
    if (error || !res || res.error) { setStep('code'); setCodeErr('קוד בית ספר שגוי. אנא פנה לצוות לישנא'); return; }
    const info: SchoolInfo = { id: res.id!, name: res.name!, code: res.code!, teacherName: nameInput.trim() };
    setSchoolSession(user.id, info);
    setSchool(info);
    setSchoolOpen(false); setStep('code'); setCodeInput(''); setNameInput('');
    toast.success(`ברוך הבא למרחב של ${info.name} 🎓`);
    refresh();
  };

  const handleCreate = async () => {
    if (!user || !school || !name.trim()) return;
    if (schoolClasses.length >= MAX_CLASSES_PER_SCHOOL) {
      toast.error(`ניתן ליצור עד ${MAX_CLASSES_PER_SCHOOL} כיתות במרחב בית ספרי`);
      return;
    }
    setBusy(true);
    try {
      for (let i = 0; i < 5; i++) {
        const code = generateClassCode();
        const { error } = await supabase.from('classes')
          .insert({ teacher_id: user.id, name: name.trim(), class_code: code, school_id: school.id });
        if (!error) {
          toast.success(`הכיתה נוצרה! קוד הצטרפות: ${code}`);
          setCreateOpen(false); setName('');
          refresh();
          return;
        }
        if (error.message.includes('class_limit_reached')) {
          toast.error(`ניתן ליצור עד ${MAX_CLASSES_PER_SCHOOL} כיתות במרחב בית ספרי`);
          return;
        }
        if (!error.message.includes('class_code')) throw error;
      }
      toast.error('שגיאה ביצירת קוד ייחודי');
    } catch {
      toast.error('שגיאה ביצירת הכיתה');
    } finally { setBusy(false); }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('join_class_by_code', { _code: joinCode.trim() });
      const res = data as { error?: string; name?: string } | null;
      if (error?.message.includes('student_limit_reached')) {
        toast.error(`הכיתה מלאה (${MAX_STUDENTS_PER_CLASS} תלמידים)`);
        return;
      }
      if (error || !res || res.error) {
        toast.error(res?.error === 'own_class' ? 'זו הכיתה שלך' : 'קוד כיתה לא נמצא');
        return;
      }
      toast.success(`הצטרפת לכיתה ${res.name ?? ''}`);
      setJoinCode('');
      refresh();
    } catch {
      toast.error('שגיאה בהצטרפות');
    } finally { setBusy(false); }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-6" dir="rtl">
        <GraduationCap className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">ביה"ס שלי</h1>
        <p className="text-muted-foreground text-center mb-6">התחבר כדי להצטרף לכיתות או לנהל מרחב בית ספרי</p>
        <Button onClick={() => navigate('/auth')}><LogIn className="w-4 h-4 ml-2" />כניסה</Button>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted" aria-label="חזור">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{school ? `המרחב הבית ספרי של ${school.name}` : 'ביה"ס שלי'}</h1>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">

        {/* Teacher school login */}
        {!school && (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><SchoolIcon className="w-4 h-4 text-primary" />אתה מורה?</h2>
            <p className="text-sm text-muted-foreground mb-3">הזן את קוד בית הספר כדי להיכנס למרחב הבית ספרי שלך</p>
            <Button onClick={() => { setSchoolOpen(true); setStep('code'); }}>
              <KeyRound className="w-4 h-4 ml-2" />כניסה עם קוד בית ספר
            </Button>
          </div>
        )}

        {/* School space */}
        {school && (
          <section className="space-y-3">
            <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-3">
                <SchoolIcon className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{school.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    קוד בית ספר: {school.code}{school.teacherName ? ` · מורה: ${school.teacherName}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => { clearSchoolSession(user.id); setSchool(null); setSchoolClasses([]); }}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground" aria-label="יציאה מהמרחב">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">כיתות בית הספר ({schoolClasses.length}/{MAX_CLASSES_PER_SCHOOL})</h3>
              <Button size="sm" onClick={() => setCreateOpen(true)} disabled={schoolClasses.length >= MAX_CLASSES_PER_SCHOOL}>
                <Plus className="w-4 h-4 ml-1" />כיתה חדשה
              </Button>
            </div>

            {loading ? <p className="text-muted-foreground text-sm">טוען...</p> :
              schoolClasses.length === 0 ? <p className="text-sm text-muted-foreground">עדיין אין כיתות במרחב. צור את הראשונה!</p> :
              <div className="space-y-3">
                {schoolClasses.map((c) => (
                  <motion.button
                    key={c.id} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/classes/${c.id}`)}
                    className="w-full text-right bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold truncate">{c.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          קוד הצטרפות: <span className="font-mono font-bold text-primary">{c.class_code}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 bg-muted px-3 py-1.5 rounded-full">
                        <Users className="w-4 h-4" />{counts[c.id] || 0}/{MAX_STUDENTS_PER_CLASS}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            }
          </section>
        )}

        {/* Student: personal average */}
        {myAverage && (
          <div className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">הממוצע האישי שלי</p>
              <p className="text-3xl font-bold text-primary mt-1">{myAverage.avg}</p>
              <p className="text-xs text-muted-foreground mt-1">{myAverage.count} מטלות שהושלמו</p>
            </div>
            <Trophy className={`w-8 h-8 ${myAverage.avg >= 90 ? 'text-yellow-500' : 'text-primary'}`} />
          </div>
        )}

        {/* Student: join */}
        <section>
          <h2 className="text-lg font-bold mb-3">הצטרף לכיתה</h2>
          <div className="bg-card rounded-2xl p-4 border border-border flex gap-2">
            <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="קוד כיתה" maxLength={8} className="text-center font-mono uppercase" />
            <Button onClick={handleJoin} disabled={busy || !joinCode.trim()}>הצטרף</Button>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">הכיתות שהצטרפת</h2>
          {joined.length === 0 ? <p className="text-sm text-muted-foreground">לא הצטרפת לאף כיתה עדיין</p> :
            <div className="space-y-3">
              {joined.map((c) => {
                const s = classAvg[c.id];
                return (
                  <motion.button
                    key={c.id} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/classes/${c.id}`)}
                    className="w-full text-right bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{c.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">קוד: <span className="font-mono">{c.class_code}</span></p>
                      </div>
                      {s ? (
                        <div className="flex items-center gap-2 shrink-0 bg-primary/10 px-3 py-1.5 rounded-full">
                          <Trophy className={`w-4 h-4 ${s.avg >= 90 ? 'text-yellow-500' : 'text-primary'}`} />
                          <div className="text-right leading-tight">
                            <p className="text-sm font-bold text-primary">ממוצע {s.avg}</p>
                            <p className="text-[10px] text-muted-foreground">{s.count} מטלות</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground shrink-0">אין הגשות</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          }
        </section>
      </div>

      {/* Create class */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setName(''); }}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>צור כיתה חדשה</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הכיתה (לדוגמה: ז'1)" />
            <p className="text-xs text-muted-foreground">
              ייווצר קוד הצטרפות ייחודי לתלמידים. עד {MAX_STUDENTS_PER_CLASS} תלמידים בכיתה.
            </p>
            <Button onClick={handleCreate} disabled={busy || !name.trim()} className="w-full">צור כיתה</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* School code login */}
      <Dialog open={schoolOpen} onOpenChange={(o) => { setSchoolOpen(o); if (!o) { setStep('code'); setCodeInput(''); setNameInput(''); setCodeErr(''); } }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-end">
              <span>{step === 'code' ? 'כניסה למרחב בית ספרי' : 'מה שמך?'}</span>
              <KeyRound className="w-5 h-5 text-primary" />
            </DialogTitle>
          </DialogHeader>
          {step === 'code' ? (
            <div className="space-y-4 mt-3">
              <p className="text-sm text-muted-foreground text-right">הזן את קוד בית הספר שקיבלת מצוות לישנא</p>
              <Input
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCodeStep(); }}
                placeholder="קוד בית ספר" inputMode="numeric"
                className="text-center font-mono text-lg h-12" autoFocus
              />
              {codeErr && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive text-center bg-destructive/10 rounded-lg p-2">{codeErr}</motion.p>
              )}
              <Button onClick={handleCodeStep} disabled={!codeInput.trim()} className="w-full h-12 text-base">המשך</Button>
            </div>
          ) : (
            <div className="space-y-4 mt-3">
              <p className="text-sm text-muted-foreground text-right">
                מתחבר ל<strong>{SCHOOL_CODES[codeInput.trim()]}</strong>. איך לקרוא לך במרחב?
              </p>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSchoolJoin(); }}
                placeholder="שם המורה" className="text-center h-12" autoFocus maxLength={60}
              />
              <Button onClick={handleSchoolJoin} disabled={busy || !nameInput.trim()} className="w-full h-12 text-base">
                כניסה למרחב
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default Classes;
