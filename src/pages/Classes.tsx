import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, Copy, GraduationCap, LogIn, KeyRound, TrendingUp, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { generateClassCode } from '@/lib/classCode';
import PageTransition from '@/components/PageTransition';

interface ClassRow { id: string; name: string; class_code: string; teacher_id: string; }

const Classes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeacher, becomeTeacherWithCode, loading: roleLoading } = useUserRole();
  const [myClasses, setMyClasses] = useState<ClassRow[]>([]);
  const [joined, setJoined] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accessErr, setAccessErr] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [teacherCode, setTeacherCode] = useState('');
  const [teacherErr, setTeacherErr] = useState('');
  const [classAvg, setClassAvg] = useState<Record<string, { avg: number; count: number }>>({});

  const handleTeacherSubmit = async () => {
    setTeacherErr('');
    const { ok } = await becomeTeacherWithCode(teacherCode);
    if (!ok) {
      setTeacherErr('קוד שגוי, אנא פנה לצוות לישנא לקבלת קוד');
      return;
    }
    toast.success('מצב מורה הופעל! 🎓');
    setTeacherModalOpen(false);
    setTeacherCode('');
  };

  useEffect(() => { document.title = 'כיתות | לישנא'; }, []);

  const refresh = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [{ data: own }, { data: members }, { data: subs }] = await Promise.all([
      supabase.from('classes').select('*').eq('teacher_id', user.id).order('created_at', { ascending: false }),
      supabase.from('class_members').select('class_id, classes(*)').eq('student_id', user.id),
      supabase.from('assignment_submissions').select('score, total, assignments!inner(class_id)').eq('student_id', user.id),
    ]);
    setMyClasses((own as ClassRow[]) || []);
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

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    if (accessCode.trim() !== '8080') {
      setAccessErr('קוד גישה שגוי. יצירת כיתה מורשית למורים בלבד.');
      return;
    }
    setAccessErr('');
    setBusy(true);
    try {
      for (let i = 0; i < 5; i++) {
        const code = generateClassCode();
        const { data, error } = await supabase
          .from('classes')
          .insert({ teacher_id: user.id, name: name.trim(), class_code: code })
          .select().single();
        if (!error && data) {
          toast.success('הכיתה נוצרה!');
          setCreateOpen(false); setName(''); setAccessCode(''); setAccessErr('');
          refresh();
          return;
        }
        if (error && !error.message.includes('class_code')) throw error;
      }
      toast.error('שגיאה ביצירת קוד ייחודי');
    } catch (e) {
      toast.error('שגיאה ביצירת הכיתה');
    } finally { setBusy(false); }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('join_class_by_code', { _code: joinCode.trim() });
      const res = data as { error?: string; name?: string } | null;
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
        <h1 className="text-2xl font-bold mb-2">כיתות</h1>
        <p className="text-muted-foreground text-center mb-6">התחבר כדי להצטרף לכיתות או ליצור כיתה חדשה</p>
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
        <h1 className="text-xl font-bold">כיתות</h1>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">

        {/* Teacher toggle */}
        {!isTeacher && !roleLoading && (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h2 className="font-semibold mb-1">אתה מורה?</h2>
            <p className="text-sm text-muted-foreground mb-3">הפעל מצב מורה כדי ליצור כיתות ומטלות</p>
            <Button onClick={() => setTeacherModalOpen(true)}>
              <GraduationCap className="w-4 h-4 ml-2" />הפוך למורה
            </Button>
          </div>
        )}

        {/* Teacher: my classes */}
        {isTeacher && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">הכיתות שלי</h2>
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 ml-1" />כיתה חדשה</Button>
            </div>
            {loading ? <p className="text-muted-foreground text-sm">טוען...</p> :
              myClasses.length === 0 ? <p className="text-sm text-muted-foreground">עדיין אין כיתות. צור את הראשונה!</p> :
              <div className="space-y-3">
                {myClasses.map((c) => (
                  <motion.button
                    key={c.id} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/classes/${c.id}`)}
                    className="w-full text-right bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{c.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">קוד: <span className="font-mono font-bold text-primary">{c.class_code}</span></p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" /></div>
                    </div>
                  </motion.button>
                ))}
              </div>
            }
          </section>
        )}

        {/* Student: join + joined classes */}
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

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setName(''); setAccessCode(''); setAccessErr(''); } }}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>צור כיתה חדשה</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הכיתה (לדוגמה: כיתה ז-1)" />
            <Input
              value={accessCode}
              onChange={(e) => { setAccessCode(e.target.value); setAccessErr(''); }}
              placeholder="קוד גישה"
              type="password"
              inputMode="numeric"
              className="text-center font-mono"
            />
            {accessErr && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive text-center bg-destructive/10 rounded-lg p-2"
              >
                {accessErr}
              </motion.p>
            )}
            <Button onClick={handleCreate} disabled={busy || !name.trim() || !accessCode.trim()} className="w-full">צור כיתה</Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={teacherModalOpen} onOpenChange={(o) => { setTeacherModalOpen(o); if (!o) { setTeacherCode(''); setTeacherErr(''); } }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-end">
                <span>גישת מורה</span>
                <KeyRound className="w-5 h-5 text-primary" />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-3">
              <p className="text-sm text-muted-foreground text-right">
                הזן את קוד הגישה למורים כדי להפעיל את מצב המורה
              </p>
              <Input
                value={teacherCode}
                onChange={(e) => { setTeacherCode(e.target.value); setTeacherErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTeacherSubmit(); }}
                placeholder="קוד גישה"
                type="password"
                inputMode="numeric"
                className="text-center font-mono text-lg h-12"
                autoFocus
              />
              {teacherErr && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive text-center bg-destructive/10 rounded-lg p-2"
                >
                  {teacherErr}
                </motion.p>
              )}
              <Button onClick={handleTeacherSubmit} disabled={!teacherCode.trim()} className="w-full h-12 text-base">
                אישור
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default Classes;
