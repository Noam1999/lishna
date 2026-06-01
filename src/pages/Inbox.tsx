import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Inbox as InboxIcon, Megaphone } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';

type SysMail = { id: string; title: string; body: string; kind: string; created_at: string; read_at: string | null };
type ClsMail = { id: string; subject: string | null; body: string; created_at: string; class_id: string };

const Inbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sys, setSys] = useState<SysMail[]>([]);
  const [cls, setCls] = useState<ClsMail[]>([]);

  const load = async () => {
    if (!user) return;
    const [s, c] = await Promise.all([
      supabase.from('system_mail').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }),
      supabase.from('class_mail').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setSys((s.data as SysMail[]) || []);
    setCls((c.data as ClsMail[]) || []);
    // mark sys read
    if (s.data?.length) {
      await supabase.from('system_mail').update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id).is('read_at', null);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

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
              {sys.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-foreground">{m.title}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
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
