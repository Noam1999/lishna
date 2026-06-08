import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('הסיסמה חייבת להכיל לפחות 6 תווים'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error('שגיאה בעדכון הסיסמה'); return; }
    toast.success('הסיסמה עודכנה בהצלחה!');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir="rtl">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-elegant">
        <h1 className="text-2xl font-bold text-center">איפוס סיסמה 🔐</h1>
        <p className="text-sm text-muted-foreground text-center">בחר סיסמה חדשה</p>
        {!ready && <p className="text-xs text-amber-500 text-center">מאמת קישור איפוס…</p>}
        <div className="flex items-center gap-3 h-12 bg-background border border-border rounded-xl px-3">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <input
            type={show ? 'text' : 'password'} placeholder="סיסמה חדשה" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent outline-none text-right"
          />
          <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <Button type="submit" disabled={loading || !ready} className="w-full h-12">
          {loading ? 'מעדכן…' : 'עדכן סיסמה'}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
