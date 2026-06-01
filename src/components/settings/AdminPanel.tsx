import { useState } from 'react';
import { Shield, ShieldCheck, Loader2, Inbox, Send, Coins, Gem } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import WordManager from './WordManager';
import SiteStats from './SiteStats';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [checking, setChecking] = useState(false);

  // Grant tool state
  const [targetEmail, setTargetEmail] = useState('');
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [mailTitle, setMailTitle] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [granting, setGranting] = useState(false);

  const checkAdmin = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error) throw error;
      setIsAdmin(!!data);
      if (data) setShowPanel(true);
    } catch { setIsAdmin(false); } finally { setChecking(false); }
  };

  const resolveUserId = async (q: string): Promise<string | null> => {
    const trimmed = q.trim();
    if (!trimmed) return null;
    // try display_name or user_id
    const { data } = await supabase.from('profiles').select('user_id, display_name').or(`display_name.eq.${trimmed},user_id.eq.${trimmed}`).maybeSingle();
    return (data as { user_id: string } | null)?.user_id || null;
  };

  const grant = async () => {
    if (!user) return;
    setGranting(true);
    try {
      const uid = await resolveUserId(targetEmail);
      if (!uid) { toast.error('משתמש לא נמצא'); return; }
      const { data: p } = await supabase.from('profiles').select('coins, diamonds').eq('user_id', uid).maybeSingle();
      if (!p) { toast.error('פרופיל לא נמצא'); return; }
      const newCoins = (p as { coins: number; diamonds: number }).coins + (coins || 0);
      const newDiamonds = (p as { coins: number; diamonds: number }).diamonds + (diamonds || 0);
      await supabase.from('profiles').update({ coins: newCoins, diamonds: newDiamonds }).eq('user_id', uid);
      if (coins || diamonds) {
        await supabase.from('system_mail').insert({
          recipient_id: uid, sender_id: user.id, kind: 'reward',
          title: 'מתנה מהמערכת 🎁',
          body: `קיבלת ${coins ? `${coins} מטבעות` : ''}${coins && diamonds ? ' ו-' : ''}${diamonds ? `${diamonds} יהלומים` : ''}`,
          meta: { coins, diamonds },
        });
      }
      if (mailTitle.trim() && mailBody.trim()) {
        await supabase.from('system_mail').insert({
          recipient_id: uid, sender_id: user.id, kind: 'system',
          title: mailTitle.trim(), body: mailBody.trim(),
        });
      }
      toast.success('בוצע בהצלחה');
      setTargetEmail(''); setCoins(0); setDiamonds(0); setMailTitle(''); setMailBody('');
    } catch (e) { toast.error('שגיאה בביצוע'); } finally { setGranting(false); }
  };

  if (!user) return null;

  if (!showPanel) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
        <Button onClick={checkAdmin} disabled={checking} variant="outline" className="w-full gap-2">
          {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          כניסת מנהל
        </Button>
        {isAdmin === false && <p className="text-sm text-destructive text-center mt-2">אין לך הרשאות מנהל</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h3 className="font-bold text-lg text-foreground">לוח בקרה למנהל</h3>
        </div>
        <WordManager />
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-3">
        <h3 className="font-bold text-foreground">הענקה ודיוור</h3>
        <Input placeholder="שם תצוגה או מזהה משתמש" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3"><Coins className="w-4 h-4 text-primary" /><Input type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value))} className="border-0 bg-transparent" /></div>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3"><Gem className="w-4 h-4 text-primary" /><Input type="number" value={diamonds} onChange={(e) => setDiamonds(Number(e.target.value))} className="border-0 bg-transparent" /></div>
        </div>
        <Input placeholder="כותרת הודעה (אופציונלי)" value={mailTitle} onChange={(e) => setMailTitle(e.target.value)} />
        <Textarea placeholder="תוכן הודעת מערכת (אופציונלי)" value={mailBody} onChange={(e) => setMailBody(e.target.value)} rows={3} />
        <Button onClick={grant} disabled={granting || !targetEmail.trim()} className="w-full gap-2">
          <Send className="w-4 h-4" /> שלח / הענק
        </Button>
      </div>

      <Button asChild variant="outline" className="w-full gap-2 h-12">
        <Link to="/admin/feedback"><Inbox className="w-5 h-5" />פניות משתמשים</Link>
      </Button>
      <SiteStats />
    </div>
  );
};

export default AdminPanel;
