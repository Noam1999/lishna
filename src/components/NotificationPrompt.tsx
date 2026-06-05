import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

const DISMISS_KEY = 'lishna:notif-prompt-dismissed';

const NotificationPrompt = () => {
  const { user } = useAuth();
  const { permission, requestPermission, supported } = useNotifications();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !supported) return;
    if (permission !== 'default') return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [user, permission, supported]);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5">
      <div className="rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-elegant p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 text-right">
          <h4 className="font-bold text-foreground">הפעל התראות 🔔</h4>
          <p className="text-sm text-muted-foreground mb-2">נזכיר לך על הרצף היומי, הגלגל וההודעות מהמורה.</p>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm" variant="ghost"
              onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setShow(false); }}
            >לא עכשיו</Button>
            <Button
              size="sm"
              onClick={async () => { await requestPermission(); setShow(false); }}
            >אפשר התראות</Button>
          </div>
        </div>
        <button
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setShow(false); }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt;
