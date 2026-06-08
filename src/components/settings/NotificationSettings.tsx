import { Bell, BellOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

const NotificationSettings = () => {
  const { permission, requestPermission, notify, supported } = useNotifications();
  const enabled = permission === 'granted';

  const onToggle = async (next: boolean) => {
    if (!supported) { toast.error('הדפדפן שלך לא תומך בהתראות'); return; }
    if (next) {
      const p = await requestPermission();
      if (p === 'denied') toast.error('ההרשאה נדחתה. אפשר התראות בהגדרות הדפדפן.');
      else if (p === 'granted') toast.success('ההתראות הופעלו 🔔');
    } else {
      toast('לכיבוי לחלוטין, פתח את הגדרות הדפדפן ובטל את הרשאת ההתראות לאתר.');
    }
  };

  const sendTest = async () => {
    if (permission !== 'granted') { toast.error('יש להפעיל התראות תחילה'); return; }
    await notify('בדיקת התראה 🔔', 'אם אתה רואה את זה — ההתראות פועלות מצוין!', 'test');
    toast.success('נשלחה התראת בדיקה');
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-4">
      <div className="flex items-center justify-between">
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={!supported} />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h3 className="font-semibold text-foreground">התראות Push</h3>
            <p className="text-sm text-muted-foreground">
              {!supported ? 'לא נתמך בדפדפן זה'
                : enabled ? 'התראות מופעלות'
                : permission === 'denied' ? 'חסום — שנה בהגדרות הדפדפן'
                : 'התראות כבויות'}
            </p>
          </div>
          {enabled ? <Bell className="w-6 h-6 text-primary" /> : <BellOff className="w-6 h-6 text-muted-foreground" />}
        </div>
      </div>
      <Button onClick={sendTest} variant="outline" className="w-full gap-2" disabled={!enabled}>
        <Send className="w-4 h-4" />
        שלח התראה לדוגמה
      </Button>
    </div>
  );
};

export default NotificationSettings;
