import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, School as SchoolIcon, KeyRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';

type SchoolRow = { id: string; name: string; school_code: string };
type ClassRow = { id: string; name: string; class_code: string };

const School = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadJoined = async () => {
    if (!user) return;
    const { data: mem } = await supabase.from('school_members').select('school_id').eq('user_id', user.id).maybeSingle();
    if (mem?.school_id) {
      const { data: s } = await supabase.from('schools').select('*').eq('id', mem.school_id).maybeSingle();
      if (s) {
        setSchool(s as SchoolRow);
        const { data: c } = await supabase.from('classes').select('id, name, class_code').eq('school_id', s.id);
        setClasses((c as ClassRow[]) || []);
      }
    }
  };

  useEffect(() => { loadJoined(); /* eslint-disable-next-line */ }, [user?.id]);

  const join = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);
    const { data: s } = await supabase.from('schools').select('*').eq('school_code', code.trim()).maybeSingle();
    if (!s) { toast.error('קוד בית ספר לא נמצא'); setLoading(false); return; }
    await supabase.from('school_members').insert({ user_id: user.id, school_id: s.id });
    toast.success(`הצטרפת ל${(s as SchoolRow).name}`);
    setSchool(s as SchoolRow);
    const { data: c } = await supabase.from('classes').select('id, name, class_code').eq('school_id', (s as SchoolRow).id);
    setClasses((c as ClassRow[]) || []);
    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen glass-backdrop pb-32">
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowRight className="w-4 h-4" /> חזרה
          </Button>
        </div>
        <Header title="מרחב בית ספרי" subtitle="הצטרפו לבית הספר ועיינו בכל הכיתות" />
        <div className="px-4 max-w-md mx-auto">
          {!school ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <KeyRound className="w-5 h-5" /><span className="font-bold">הזן קוד בית ספר</span>
              </div>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="לדוגמה 8080" className="text-center text-xl tracking-widest" />
              <Button onClick={join} disabled={loading || !code.trim()} className="w-full">הצטרף</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20 flex items-center gap-3">
                <SchoolIcon className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-bold text-lg text-foreground">{school.name}</h3>
                  <p className="text-xs text-muted-foreground">קוד: {school.school_code}</p>
                </div>
              </div>
              <h4 className="font-bold text-foreground mt-4">כיתות בבית הספר</h4>
              {classes.length === 0 && <p className="text-muted-foreground text-sm">אין עדיין כיתות בבית הספר</p>}
              {classes.map((c) => (
                <button key={c.id} onClick={() => navigate(`/classes/${c.id}`)} className="w-full bg-card border border-border rounded-2xl p-4 shadow-soft flex items-center justify-between text-right hover:bg-muted transition">
                  <div>
                    <p className="font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">קוד: {c.class_code}</p>
                  </div>
                  <Users className="w-5 h-5 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default School;
