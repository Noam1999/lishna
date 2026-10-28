import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const DIAMOND_COST = 1;
const MAX_HISTORY = 20;

interface HistoryItem {
  text: string;
  context?: string;
  result: string;
  ts: number;
}

const historyKey = (uid: string) => `lishna:ai-history:${uid}`;

const loadHistory = (uid: string): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(historyKey(uid));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};

const AIExplainer = () => {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  const [needPay, setNeedPay] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setHistory(loadHistory(user.id));
    supabase.from('ai_usage').select('free_used').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setFreeLeft(Math.max(0, 3 - (data?.free_used ?? 0))));
  }, [user]);

  const saveToHistory = (item: HistoryItem) => {
    if (!user) return;
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, MAX_HISTORY);
      try { localStorage.setItem(historyKey(user.id), JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const clearHistory = () => {
    if (!user) return;
    setHistory([]);
    setOpenIdx(null);
    try { localStorage.removeItem(historyKey(user.id)); } catch { /* ignore */ }
  };

  const run = async (pay = false) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult('');
    const { data, error: err } = await supabase.functions.invoke('aramaic-explain', {
      body: { text: text.trim(), context: context.trim() || undefined, pay },
    });
    setLoading(false);
    if (err || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (err as any)?.context?.json())?.error; } catch { /* ignore */ }
      setError(msg || 'שגיאה, נסה שוב');
      if (data?.reason === 'limit') { setNeedPay(true); setFreeLeft(0); }
      return;
    }
    setNeedPay(false);
    if (typeof data.usage?.free_left === 'number') setFreeLeft(data.usage.free_left);
    setResult(data.result);
    saveToHistory({ text: text.trim(), context: context.trim() || undefined, result: data.result, ts: Date.now() });
  };

  return (
    <div className="px-6 mb-6">
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">תרגום והסבר דקדוקי ב-AI</h3>
        </div>
        {!user ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            התכונה זמינה למשתמשים רשומים בלבד. <Link to="/auth" className="text-primary font-semibold underline">התחבר</Link>
          </p>
        ) : (<>
        <p className="text-xs text-muted-foreground">
          {freeLeft === null ? '' : freeLeft > 0
            ? (freeLeft === 1
              ? `נותר שימוש חינמי אחד, אחר כך כל שימוש נוסף עולה 💎 ${DIAMOND_COST}`
              : `נותרו ${freeLeft} שימושים חינמיים, אחר כך כל שימוש נוסף עולה 💎 ${DIAMOND_COST}`)
            : `השימושים החינמיים נגמרו — כל שימוש נוסף עולה 💎 ${DIAMOND_COST}`}
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="הזן מילה או משפט בארמית בבלית..."
          className="font-display text-lg glass-input"
          maxLength={1000}
          rows={2}
        />
        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="הקשר (לא חובה) — למשל: מסכת ברכות ב ע״א"
          className="text-sm glass-input"
          maxLength={300}
          rows={1}
        />
        <Button onClick={() => run(freeLeft === 0)} disabled={loading || !text.trim()} className="w-full rounded-full">
          {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
          {loading ? 'מנתח...' : freeLeft === 0 ? `תרגם והסבר (💎 ${DIAMOND_COST})` : 'תרגם והסבר'}
        </Button>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {result && (
          <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-primary [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pr-5 [&_li]:my-0.5 [&_p]:my-1 leading-relaxed animate-fade-in">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
        </>)}
      </div>
    </div>
  );
};

export default AIExplainer;
