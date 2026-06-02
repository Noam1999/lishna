import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Inbox as InboxIcon, Megaphone, Gift, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';

type MailMeta = { coins?: number; diamonds?: number; claimed?: boolean } | null;
type SysMail = { id: string; title: string; body: string; kind: string; created_at: string; read_at: string | null; meta: MailMeta };
type ClsMail = { id: string; subject: string | null; body: string; created_at: string; class_id: string };

const Inbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [sys, setSys] = useState<SysMail[]>([]);
  const [cls, setCls] = useState<ClsMail[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [s, c] = await Promise.all([
      supabase.from('system_mail').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }),
      supabase.from('class_mail').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setSys((s.data as SysMail[]) || []);
    setCls((c.data as ClsMail[]) || []);
    // mark non-reward messages as read; leave pending rewards unread until claimed
    const toRead = ((s.data as SysMail[]) || []).filter((m) => !m.read_at && !(m.kind === 'reward' && m.meta && !m.meta.claimed));
    if (toRead.length) {
      await supabase.from('system_mail').update({ read_at: new Date().toISOString() })
        .in('id', toRead.map((m) => m.id));
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const claim = async (m: SysMail) => {
    if (!user || !profile || !m.meta) return;
    setClaiming(m.id);
    try {
      const addCoins = m.meta.coins || 0;
      const addDiamonds = m.meta.diamonds || 0;
      await updateProfile({
        coins: profile.coins + addCoins,
        diamonds: profile.diamonds + addDiamonds,
      });
      await supabase.from('system_mail').update({
        read_at: new Date().toISOString(),
        meta: { ...m.meta, claimed: true },
      }).eq('id', m.id);
      toast.success('המתנה התקבלה!');
      load();
    } catch {
      toast.error('שגיאה בקבלת המתנה');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32">
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowRight className="w-4 h-4" /> חזרה
          </Button>
        </div>
        <Header title="תיבת הדואר" subtitle="הודעות מערכת והודעות כיתה" />
        <div className="px-4">
          <Tabs defaultValue="system">
            <TabsList className="w-full">
              <TabsTrigger value="system" className="flex-1 gap-2"><InboxIcon className="w-4 h-4" />דואר אישי</TabsTrigger>
              <TabsTrigger value="class" className="flex-1 gap-2"><Megaphone className="w-4 h-4" />דואר כיתתי</TabsTrigger>
            </TabsList>
            <TabsContent value="system" className="space-y-2 mt-4">
              {sys.length === 0 && <p className="text-center text-muted-foreground py-8">אין הודעות</p>}
              {sys.map((m) => {
                const pendingGift = m.kind === 'reward' && m.meta && !m.meta.claimed && ((m.meta.coins || 0) > 0 || (m.meta.diamonds || 0) > 0);
                return (
                  <div key={m.id} className={`bg-card border rounded-2xl p-4 shadow-soft ${pendingGift ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-foreground flex items-center gap-1.5">
                        {pendingGift && <Gift className="w-4 h-4 text-primary" />}
                        {m.title}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(m.created_at).toLocaleDateString('he-IL')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.body}</p>
                    {pendingGift && (
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-3 text-sm font-bold">
                          {(m.meta!.coins || 0) > 0 && <span className="flex items-center gap-1">💰 {m.meta!.coins}</span>}
                          {(m.meta!.diamonds || 0) > 0 && <span className="flex items-center gap-1">💎 {m.meta!.diamonds}</span>}
                        </div>
                        <Button size="sm" onClick={() => claim(m)} disabled={claiming === m.id} className="gap-1">
                          {claiming === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                          קבל
                        </Button>
                      </div>
                    )}
                    {m.kind === 'reward' && m.meta?.claimed && (
                      <p className="text-xs text-primary mt-2">✓ התקבל</p>
                    )}
                  </div>
                );
              })}
            </TabsContent>
            <TabsContent value="class" className="space-y-2 mt-4">
              {cls.length === 0 && <p className="text-center text-muted-foreground py-8">אין הודעות כיתה</p>}
              {cls.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                  {m.subject && <h3 className="font-bold text-foreground">{m.subject}</h3>}
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.body}</p>
                  <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString('he-IL')}</span>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default Inbox;
