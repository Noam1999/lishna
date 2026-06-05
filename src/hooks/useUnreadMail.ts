import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMail = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetch = async () => {
    if (!user) return setCount(0);
    const [m, d] = await Promise.all([
      supabase.from('system_mail').select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id).is('read_at', null),
      supabase.from('direct_messages').select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id).is('read_at', null),
    ]);
    setCount((m.count || 0) + (d.count || 0));
  };

  useEffect(() => {
    fetch();
    if (!user) return;
    const notify = (title: string, body: string, tag: string) => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      navigator.serviceWorker?.getRegistration?.().then((reg) => {
        if (reg) reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/favicon-32.png', tag, dir: 'rtl', lang: 'he' });
        else new Notification(title, { body, icon: '/icon-192.png', tag, dir: 'rtl', lang: 'he' });
      }).catch(() => {});
    };
    const ch = supabase.channel(`unread-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_mail', filter: `recipient_id=eq.${user.id}` }, (payload: any) => {
        fetch();
        const row = payload?.new;
        if (row?.kind === 'assignment' || (row?.title && /משימה|מטלה|מבחן/.test(row.title))) {
          notify('המורה שלך צירף משימה חדשה! 📚', row.title || 'נכנס לתיבת הדואר לפרטים.', `mail-${row.id}`);
        } else if (row?.title) {
          notify(row.title, row.body?.slice(0, 120) || '', `mail-${row.id}`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_mail', filter: `recipient_id=eq.${user.id}` }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${user.id}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { count, refetch: fetch };
};
