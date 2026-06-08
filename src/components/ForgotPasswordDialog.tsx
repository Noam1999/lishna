import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; defaultEmail?: string; }

const ForgotPasswordDialog = ({ open, onOpenChange, defaultEmail = '' }: Props) => {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!email.includes('@')) { toast.error('נא להזין אימייל תקין'); return; }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) { toast.error('שגיאה בשליחת המייל'); return; }
    toast.success('נשלח אליך מייל לאיפוס הסיסמה 📧');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader><DialogTitle className="text-right">שכחת סיסמה? 🔑</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-right">הזן את האימייל שלך ונשלח לך קישור לאיפוס.</p>
          <Input
            type="email" placeholder="הדואר האלקטרוני שלך"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="text-right" dir="rtl"
          />
          <Button onClick={submit} disabled={sending} className="w-full">
            {sending ? 'שולח…' : 'שלח קישור איפוס'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
