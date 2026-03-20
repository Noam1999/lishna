import { useState } from 'react';
import { MessageCircle, Send, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const feedbackTypes = [
  { value: 'bug', label: 'באג 🐛', icon: Bug },
  { value: 'idea', label: 'רעיון 💡', icon: Lightbulb },
  { value: 'general', label: 'משוב כללי 💬', icon: MessageSquare },
] as const;

const FeedbackButton = () => {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('אנא כתוב הודעה');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('feedback' as any).insert({
        user_id: user?.id || null,
        feedback_type: type,
        message: message.trim(),
        email: email.trim() || null,
      } as any);
      if (error) throw error;
      toast.success('תודה על המשוב! 🙏');
      setMessage('');
      setEmail('');
      setType('general');
      setOpen(false);
    } catch {
      toast.error('שגיאה בשליחה, נסה שוב');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="fixed bottom-24 left-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-elegant hover:shadow-lg transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ padding: hovered ? '12px 18px' : '12px' }}
        aria-label="דיווח על באג / משוב"
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              דיווח על באג / משוב
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right text-lg">שלח משוב 📬</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type selector */}
            <div className="flex gap-2 justify-end">
              {feedbackTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Message */}
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ספר לנו מה אתה חושב..."
              className="min-h-[120px] text-right resize-none"
              maxLength={1000}
              dir="rtl"
            />

            {/* Email (optional for non-authenticated) */}
            {!user && (
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="אימייל ליצירת קשר (אופציונלי)"
                type="email"
                className="text-right"
                dir="rtl"
              />
            )}

            <Button
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'שולח...' : 'שלח משוב'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
