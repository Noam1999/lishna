import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpenText, Loader2, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { haptic } from '@/lib/haptics';

const DIAMOND_COST = 1;

const QUICK_PROMPTS = [
  { icon: '💡', text: 'סכם לי את מהלך הסוגיה' },
  { icon: '❓', text: 'מה הקושיא המרכזית כאן?' },
  { icon: '⚖️', text: 'מי הם בעלי המחלוקת ומה דעתם?' },
  { icon: '🔍', text: 'הסבר לי את השורה הראשונה במילים פשוטות' },
];

type Msg = { role: 'user' | 'assistant'; content: string };

interface Props {
  title: string;
  lines: string[];
}

const ChavrutaDrawer = ({ title, lines }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // New page → new conversation
  useEffect(() => { setMessages([]); setError(''); }, [title]);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from('ai_usage').select('free_used').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setFreeLeft(Math.max(0, 3 - (data?.free_used ?? 0))));
  }, [user, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || loading || !user) return;
    haptic();
    const next: Msg[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);
    const { data, error: err } = await supabase.functions.invoke('gemara-chavruta', {
      body: { messages: next, title, text: lines.join('\n'), pay: freeLeft === 0 },
    });
    setLoading(false);
    if (err || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (err as any)?.context?.json())?.error; } catch { /* ignore */ }
      setError(msg || 'שגיאה, נסה שוב');
      if (data?.reason === 'limit') setFreeLeft(0);
      setMessages(messages); // roll back the unanswered question
      setInput(question);
      return;
    }
    if (typeof data.usage?.free_left === 'number') setFreeLeft(data.usage.free_left);
    setMessages([...next, { role: 'assistant', content: data.result }]);
  };

  const usageText = freeLeft === null ? '' : freeLeft > 0
    ? (freeLeft === 1 ? 'נותר שימוש חינמי אחד' : `נותרו ${freeLeft} שימושים חינמיים`)
    : `כל שאלה עולה 💎 ${DIAMOND_COST}`;

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => { haptic(); setOpen(true); }}
        className="fixed bottom-24 left-4 z-40 glass rounded-full h-14 pl-5 pr-4 flex items-center gap-2 shadow-elevated animate-glass-float text-foreground hover:scale-105 transition-transform"
        aria-label="שאל את החברותא"
      >
        <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <BookOpenText className="w-5 h-5" />
        </span>
        <span className="text-sm font-semibold">שאל את החברותא</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" dir="rtl" className="glass w-full sm:max-w-md p-0 flex flex-col gap-0">
          <SheetHeader className="p-4 border-b border-border/50 text-right space-y-1">
            <SheetTitle className="flex items-center gap-2 font-display">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <BookOpenText className="w-4 h-4" />
              </span>
              חברותא AI
            </SheetTitle>
            <SheetDescription className="text-xs">
              {title}{usageText && ` · ${usageText}`}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-border/50">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.text}
                type="button"
                disabled={loading}
                onClick={() => send(p.text)}
                className="glass rounded-full px-3 py-1.5 text-xs text-foreground hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {p.icon} {p.text}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {!messages.length && !loading && (
              <div className="text-center text-sm text-muted-foreground py-10 space-y-2">
                <p className="text-3xl">📖</p>
                <p>שלום! אני החברותא שלך לדף הזה.</p>
                <p className="text-xs">בחר שאלה מהירה למעלה או כתוב שאלה משלך.</p>
              </div>
            )}
            {messages.map((m, i) => m.role === 'user' ? (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="prose prose-sm max-w-none text-foreground [&_h2]:text-primary [&_h2]:text-base [&_h3]:text-primary [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:pr-5 [&_li]:my-0.5 [&_p]:my-1 leading-relaxed animate-fade-in">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> החברותא חושב...
              </div>
            )}
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-border/50 flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder={freeLeft === 0 ? `שאל שאלה (💎 ${DIAMOND_COST})...` : 'שאל שאלה על הסוגיה...'}
              className="glass-input min-h-[44px] max-h-32 resize-none text-sm"
              maxLength={1000}
              rows={1}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
              aria-label="שלח"
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => { setMessages([]); setError(''); }}
                className="shrink-0 w-11 h-11 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-destructive"
                aria-label="שיחה חדשה"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ChavrutaDrawer;
