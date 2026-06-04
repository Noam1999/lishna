import { useEffect, useState } from 'react';
import { Shield, ShieldCheck, Loader2, Inbox, Send, Coins, Gem, Check, ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import WordManager from './WordManager';
import SiteStats from './SiteStats';

type UserOption = { user_id: string; display_name: string | null; username: string | null };

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [checking, setChecking] = useState(false);

  // Grant tool state
  const [users, setUsers] = useState<UserOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [coins, setCoins] = useState<string>('');
  const [diamonds, setDiamonds] = useState<string>('');
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

  useEffect(() => {
    if (!showPanel) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('user_id, display_name, username').order('display_name', { ascending: true }).limit(1000);
      setUsers((data as UserOption[]) || []);
    })();
  }, [showPanel]);

  const selectedUser = users.find((u) => u.user_id === targetUserId);

  const grant = async () => {
    if (!user) return;
    if (!targetUserId) { toast.error('בחר משתמש'); return; }
    const coinsNum = parseInt(coins, 10) || 0;
    const diamondsNum = parseInt(diamonds, 10) || 0;
    setGranting(true);
    try {
      const uid = targetUserId;
      if (coinsNum || diamondsNum) {
        await supabase.from('system_mail').insert({
          recipient_id: uid, sender_id: user.id, kind: 'reward',
          title: 'מתנה ממתינה לקבלה 🎁',
          body: `קיבלת מתנה: ${coinsNum ? `${coinsNum} מטבעות` : ''}${coinsNum && diamondsNum ? ' ו-' : ''}${diamondsNum ? `${diamondsNum} יהלומים` : ''}. לחץ על "קבל" כדי להוסיף ליתרה שלך.`,
          meta: { coins: coinsNum, diamonds: diamondsNum, claimed: false },
        });
      }
      if (mailTitle.trim() && mailBody.trim()) {
        await supabase.from('system_mail').insert({
          recipient_id: uid, sender_id: user.id, kind: 'system',
          title: mailTitle.trim(), body: mailBody.trim(),
        });
      }
      toast.success('נשלח בהצלחה');
      setTargetUserId(''); setCoins(''); setDiamonds(''); setMailTitle(''); setMailBody('');
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

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between">
              {selectedUser ? (selectedUser.display_name || selectedUser.username || 'משתמש') : 'בחר משתמש...'}
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command filter={(value, search) => {
              const u = users.find((x) => x.user_id === value);
              const hay = `${u?.display_name || ''} ${u?.username || ''}`.toLowerCase();
              return hay.includes(search.toLowerCase()) ? 1 : 0;
            }}>
              <CommandInput placeholder="חפש משתמש..." />
              <CommandList>
                <CommandEmpty>לא נמצאו משתמשים</CommandEmpty>
                <CommandGroup>
                  {users.map((u) => (
                    <CommandItem
                      key={u.user_id}
                      value={u.user_id}
                      onSelect={() => { setTargetUserId(u.user_id); setPickerOpen(false); }}
                    >
                      <Check className={cn('ml-2 w-4 h-4', targetUserId === u.user_id ? 'opacity-100' : 'opacity-0')} />
                      <span className="flex-1">{u.display_name || u.username || 'משתמש ללא שם'}</span>
                      {u.username && <span className="text-xs text-muted-foreground">@{u.username}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3">
            <Coins className="w-4 h-4 text-primary" />
            <Input type="number" inputMode="numeric" placeholder="מטבעות" value={coins} onChange={(e) => setCoins(e.target.value)} className="border-0 bg-transparent" />
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3">
            <Gem className="w-4 h-4 text-primary" />
            <Input type="number" inputMode="numeric" placeholder="יהלומים" value={diamonds} onChange={(e) => setDiamonds(e.target.value)} className="border-0 bg-transparent" />
          </div>
        </div>
        <Input placeholder="כותרת הודעה (אופציונלי)" value={mailTitle} onChange={(e) => setMailTitle(e.target.value)} />
        <Textarea placeholder="תוכן הודעת מערכת (אופציונלי)" value={mailBody} onChange={(e) => setMailBody(e.target.value)} rows={3} />
        <Button onClick={grant} disabled={granting || !targetUserId} className="w-full gap-2">
          <Send className="w-4 h-4" /> שלח / הענק
        </Button>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-3">
        <h3 className="font-bold text-foreground">📣 פרסם עדכון מערכת לכל המשתמשים</h3>
        <Input id="sys-title" placeholder="כותרת קצרה (לדוגמה: פיצ׳ר חדש!)" />
        <Textarea id="sys-body" rows={2} placeholder="תיאור..." />
        <Button
          onClick={async () => {
            const title = (document.getElementById('sys-title') as HTMLInputElement)?.value?.trim();
            const body = (document.getElementById('sys-body') as HTMLTextAreaElement)?.value?.trim();
            if (!title) { toast.error('הזן כותרת'); return; }
            if (!user) return;
            const { error } = await supabase.from('user_activities').insert([{
              user_id: user.id, activity_type: 'system_update',
              activity_data: { title, body } as never,
            }]);
            if (error) toast.error('שליחה נכשלה'); else {
              toast.success('עדכון פורסם לכולם');
              (document.getElementById('sys-title') as HTMLInputElement).value = '';
              (document.getElementById('sys-body') as HTMLTextAreaElement).value = '';
            }
          }}
          className="w-full gap-2"
        ><Send className="w-4 h-4" /> פרסם לכולם</Button>

      <Button asChild variant="outline" className="w-full gap-2 h-12">
        <Link to="/admin/feedback"><Inbox className="w-5 h-5" />פניות משתמשים</Link>
      </Button>
      <SiteStats />
    </div>
  );
};

export default AdminPanel;
