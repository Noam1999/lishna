import { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomWord {
  id: number;
  aramaic: string;
  hebrew: string;
  word_type: string;
  cultural_context: string;
}

const WordManager = () => {
  const [words, setWords] = useState<CustomWord[]>([]);
  const [aramaic, setAramaic] = useState('');
  const [hebrew, setHebrew] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchWords = async () => {
    const { data, error } = await supabase
      .from('custom_words')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) setWords(data);
    setLoading(false);
  };

  useEffect(() => { fetchWords(); }, []);

  const addWord = async () => {
    if (!aramaic.trim() || !hebrew.trim()) {
      toast.error('נא למלא שני שדות');
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from('custom_words').insert({
        aramaic: aramaic.trim(),
        hebrew: hebrew.trim(),
      });
      if (error) throw error;
      toast.success('מילה נוספה! 📝');
      setAramaic('');
      setHebrew('');
      fetchWords();
    } catch {
      toast.error('שגיאה בהוספה');
    } finally {
      setAdding(false);
    }
  };

  const deleteWord = async (id: number) => {
    try {
      const { error } = await supabase.from('custom_words').delete().eq('id', id);
      if (error) throw error;
      setWords(prev => prev.filter(w => w.id !== id));
      toast.success('מילה נמחקה');
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">ניהול מילים מותאמות</h4>
      </div>

      {/* Add word form */}
      <div className="flex gap-2">
        <Input
          value={aramaic}
          onChange={e => setAramaic(e.target.value)}
          placeholder="ארמית"
          className="text-right flex-1"
          dir="rtl"
        />
        <Input
          value={hebrew}
          onChange={e => setHebrew(e.target.value)}
          placeholder="עברית"
          className="text-right flex-1"
          dir="rtl"
        />
        <Button onClick={addWord} disabled={adding} size="icon" className="shrink-0">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      {/* Word list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : words.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">אין מילים מותאמות עדיין</p>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {words.map(word => (
              <div
                key={word.id}
                className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 border border-border"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteWord(word.id)}
                  className="text-destructive hover:text-destructive shrink-0 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="text-right flex-1">
                  <span className="font-medium text-foreground">{word.aramaic}</span>
                  <span className="text-muted-foreground mx-2">—</span>
                  <span className="text-muted-foreground">{word.hebrew}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default WordManager;
