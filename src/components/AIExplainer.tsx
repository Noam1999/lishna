import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const AIExplainer = () => {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult('');
    const { data, error: err } = await supabase.functions.invoke('aramaic-explain', {
      body: { text: text.trim(), context: context.trim() || undefined },
    });
    setLoading(false);
    if (err || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (err as any)?.context?.json())?.error; } catch { /* ignore */ }
      setError(msg || 'שגיאה, נסה שוב');
      return;
    }
    setResult(data.result);
  };

  return (
    <div className="px-6 mb-6">
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">תרגום והסבר דקדוקי ב-AI</h3>
        </div>
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
        <Button onClick={run} disabled={loading || !text.trim()} className="w-full rounded-full">
          {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
          {loading ? 'מנתח...' : 'תרגם והסבר'}
        </Button>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {result && (
          <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-primary [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pr-5 [&_li]:my-0.5 [&_p]:my-1 leading-relaxed animate-fade-in">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIExplainer;
