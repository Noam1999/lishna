import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';
import { sendPushTo } from '@/lib/push';

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Profile = { user_id: string; display_name: string | null };
type Thread = { other: Profile; lastBody: string; lastAt: string };

const Chat = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [other, setOther] = useState<Profile | null>(null);
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    if (!user) return;
    const { data } = await supabase.from('direct_messages').select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    const rows = (data as Msg[]) || [];
    const byOther = new Map<string, Msg>();
    rows.forEach((m) => {
      const o = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!byOther.has(o)) byOther.set(o, m);
    });
    const ids = Array.from(byOther.keys());
    const { data: profs } = await supabase.from('profiles').select('user_id, display_name').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    setThreads(ids.map((id) => {
      const last = byOther.get(id)!;
      const p = (profs as Profile[] | null)?.find((x) => x.user_id === id) || { user_id: id, display_name: null };
      return { other: p, lastBody: last.body, lastAt: last.created_at };
    }));
    // Load all users for "new chat"
    const { data: all } = await supabase.from('profiles').select('user_id, display_name').neq('user_id', user.id).order('display_name', { ascending: true }).limit(500);
    setAllUsers((all as Profile[]) || []);
  };

  const loadConv = async (otherId: string) => {
    if (!user) return;
    const { data: p } = await supabase.from('profiles').select('user_id, display_name').eq('user_id', otherId).maybeSingle();
    setOther((p as Profile) || { user_id: otherId, display_name: null });
    const { data } = await supabase.from('direct_messages').select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages((data as Msg[]) || []);
    await supabase.from('direct_messages').update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherId).eq('recipient_id', user.id).is('read_at', null);
  };

  useEffect(() => {
    if (!user) return;
    if (userId) loadConv(userId); else loadThreads();
    const ch = supabase.channel(`chat-${user.id}-${userId || 'list'}`).on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages' },
      (payload) => {
        const m = payload.new as Msg;
        if (m.sender_id !== user.id && m.recipient_id !== user.id) return;
        if (userId) {
          if ((m.sender_id === userId && m.recipient_id === user.id) || (m.sender_id === user.id && m.recipient_id === userId)) {
            setMessages((prev) => [...prev, m]);
          }
        } else loadThreads();
      },
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user?.id, userId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const send = async () => {
    if (!user || !userId || !body.trim()) return;
    const text = body.trim();
    // Normalize: strip niqqud, lowercase
    const stripNiqqud = (s: string) => s.replace(/[\u0591-\u05C7]/g, '');
    const norm = (s: string) => stripNiqqud(s).toLowerCase().trim();
    const normText = norm(text);
    // Forbidden-word check against shared classes
    const { data: myCls } = await supabase.from('class_members').select('class_id').eq('student_id', user.id);
    const { data: oCls } = await supabase.from('class_members').select('class_id').eq('student_id', userId);
    const shared = (myCls || []).map((x: { class_id: string }) => x.class_id).filter((c) => (oCls || []).some((y: { class_id: string }) => y.class_id === c));
    if (shared.length) {
      const { data: cls } = await supabase.from('classes').select('id, teacher_id, forbidden_words').in('id', shared);
      for (const c of (cls as { id: string; teacher_id: string; forbidden_words: string[] }[] | null) || []) {
        const hit = (c.forbidden_words || []).map(norm).filter(Boolean).find((w) => normText.includes(w));
        if (hit) {
          await supabase.from('system_mail').insert({
            recipient_id: c.teacher_id, sender_id: user.id, kind: 'teacher_alert',
            title: 'מילה אסורה זוהתה',
            body: `המשתמש ניסה לשלוח את המילה האסורה "${hit}"`,
            meta: { class_id: c.id, recipient_id: userId, word: hit },
          });
          toast.error('הודעה נחסמה: מכילה מילה אסורה. המורה עודכן.');
          return;
        }
      }
    }
    const { error } = await supabase.from('direct_messages').insert({ sender_id: user.id, recipient_id: userId, body: text });
    if (error) return toast.error('שליחה נכשלה');
    // Fire-and-forget push to recipient
    const { data: me } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();
    const senderName = (me as { display_name: string | null } | null)?.display_name || 'מישהו';
    sendPushTo([userId], `הודעה חדשה מ${senderName} 💬`, text.slice(0, 120), `/chat?u=${userId}`);
    setBody('');
  };


  return (
    <PageTransition>
      <div className="min-h-screen glass-backdrop pb-32 flex flex-col">
        <div className="px-4 pt-4">
          <Button variant="ghost" size="sm" onClick={() => userId ? navigate('/chat') : navigate(-1)} className="gap-1">
            <ArrowRight className="w-4 h-4" /> חזרה
          </Button>
        </div>
        <Header title={userId ? (other?.display_name || 'שיחה') : 'הודעות'} />
        {!userId ? (
          <div className="px-4 space-y-4">
            <Input placeholder="חפש משתמש להתחיל שיחה..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {threads.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-muted-foreground px-1">שיחות אחרונות</h3>
                {threads.map((t) => (
                  <button key={t.other.user_id} onClick={() => navigate(`/chat/${t.other.user_id}`)} className="w-full bg-card border border-border rounded-2xl p-4 shadow-soft text-right hover:bg-muted transition">
                    <p className="font-bold text-foreground">{t.other.display_name || 'משתמש'}</p>
                    <p className="text-sm text-muted-foreground truncate">{t.lastBody}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground px-1">משתמשים</h3>
              {allUsers
                .filter((u) => !search.trim() || (u.display_name || '').toLowerCase().includes(search.trim().toLowerCase()))
                .filter((u) => !threads.some((t) => t.other.user_id === u.user_id))
                .slice(0, 100)
                .map((u) => (
                  <button key={u.user_id} onClick={() => navigate(`/chat/${u.user_id}`)} className="w-full bg-card border border-border rounded-2xl p-3 shadow-soft text-right hover:bg-muted transition flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {(u.display_name || 'מ')[0].toUpperCase()}
                    </div>
                    <p className="font-medium text-foreground">{u.display_name || 'משתמש'}</p>
                  </button>
                ))}
              {allUsers.length === 0 && threads.length === 0 && (
                <p className="text-center text-muted-foreground py-8">אין משתמשים זמינים</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.sender_id === user?.id ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-card border border-border text-foreground'}`}>
                  <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                </div>
              ))}
            </div>
            <div className="px-4 pt-3 sticky bottom-20 bg-background">
              <div className="flex gap-2">
                <Input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="כתוב הודעה..." />
                <Button onClick={send} size="icon"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default Chat;
