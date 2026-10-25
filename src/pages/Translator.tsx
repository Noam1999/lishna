import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Volume2, Plus, ArrowLeftRight, BookOpen, Search, Check } from 'lucide-react';
import Header from '@/components/Header';
import { useDictionary, DictionaryWord } from '@/contexts/DictionaryContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { useUserWords } from '@/hooks/useUserWords';

const RECENT_SEARCHES_KEY = 'translator_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const Translator = () => {
  const { searchWord, getSuggestions, dictionary } = useDictionary();
  const { learnedWordIds, isWordLearned } = useUserWords();
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState<'hebrew-to-aramaic' | 'aramaic-to-hebrew'>('hebrew-to-aramaic');
  const [result, setResult] = useState<DictionaryWord | null>(null);
  const [recentSearches, setRecentSearches] = useState<DictionaryWord[]>([]);
  const [searchParams] = useSearchParams();

  // Deep link support: /translator?q=<aramaic word>
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setDirection('aramaic-to-hebrew');
      setQuery(q);
    }
  }, [searchParams]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        const ids = JSON.parse(saved) as number[];
        const words = ids
          .map(id => dictionary.find(w => w.id === id))
          .filter((w): w is DictionaryWord => w !== undefined);
        setRecentSearches(words);
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, [dictionary]);

  // Save recent search when a word is selected
  const addToRecentSearches = useCallback((word: DictionaryWord) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(w => w.id !== word.id);
      const updated = [word, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated.map(w => w.id)));
      return updated;
    });
  }, []);

  // Get suggestions based on current query
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return getSuggestions(query, direction, 5);
  }, [query, direction, getSuggestions]);

  useEffect(() => {
    if (query.trim()) {
      const found = searchWord(query, direction);
      setResult(found);
    } else {
      setResult(null);
    }
  }, [query, direction, searchWord]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'הועתק!',
      description: 'הטקסט הועתק ללוח',
    });
  };

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    speechSynthesis.speak(utterance);
  };

  const handleAddToFlashcards = (word: DictionaryWord) => {
    if (!recentSearches.find(w => w.id === word.id)) {
      setRecentSearches(prev => [word, ...prev].slice(0, 5));
    }
    toast({
      title: 'נוסף לרשימה!',
      description: 'המילה נשמרה לתרגול',
    });
  };

  const handleSelectSuggestion = (word: DictionaryWord) => {
    setResult(word);
    addToRecentSearches(word);
  };

  const toggleDirection = () => {
    setDirection(prev => 
      prev === 'hebrew-to-aramaic' ? 'aramaic-to-hebrew' : 'hebrew-to-aramaic'
    );
    setQuery('');
    setResult(null);
  };

  return (
    <div className="min-h-screen glass-backdrop pb-24">
      <Header 
        title="תרגומון" 
        subtitle="חפש מילים בעברית או בארמית"
      />

      {/* Direction Toggle */}
      <div className="px-6 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDirection}
              className="flex items-center gap-3 w-full group"
            >
              <div className="flex-1 text-center">
                <span className={`text-sm font-medium transition-colors ${
                  direction === 'hebrew-to-aramaic' ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  עברית
                </span>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-center">
                <span className={`text-sm font-medium transition-colors ${
                  direction === 'aramaic-to-hebrew' ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  ארמית
                </span>
              </div>
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {direction === 'hebrew-to-aramaic' ? 'חפש בעברית לקבל ארמית' : 'חפש בארמית לקבל עברית'}
          </p>
        </div>
      </div>

      {/* Search Input with Autocomplete */}
      <div className="px-6 mb-6">
        <SearchAutocomplete
          value={query}
          onChange={setQuery}
          onSelect={handleSelectSuggestion}
          suggestions={suggestions}
          placeholder={direction === 'hebrew-to-aramaic' ? 'הקלד מילה בעברית...' : 'הקלד מילה בארמית...'}
          direction={direction}
          recentSearches={recentSearches}
          learnedWordIds={learnedWordIds}
        />
      </div>

      {/* Result Card */}
      {result && (
        <div className="px-6 mb-6 animate-fade-in">
          <div className="bg-card rounded-2xl p-6 shadow-elegant border border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {isWordLearned(result.id) && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">
                    <Check className="w-3 h-3" />
                    <span>נלמד</span>
                  </div>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {result.type}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">
                  {direction === 'hebrew-to-aramaic' ? result.hebrew : result.aramaic}
                </p>
                <p className="text-3xl font-display font-bold text-foreground">
                  {direction === 'hebrew-to-aramaic' ? result.aramaic : result.hebrew}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(direction === 'hebrew-to-aramaic' ? result.aramaic : result.hebrew)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 ml-2" />
                העתק
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSpeak(result.hebrew)}
                className="flex-1"
              >
                <Volume2 className="w-4 h-4 ml-2" />
                השמע
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddToFlashcards(result)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 ml-2" />
                שמור
              </Button>
            </div>

            {/* Cultural Context */}
            <div className="bg-accent/30 rounded-xl p-4 border border-accent/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">הקשר תרבותי</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.culturalContext}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && query && (
        <div className="px-6 text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">לא נמצאה מילה תואמת</p>
          <p className="text-sm text-muted-foreground mt-1">נסה מילה אחרת</p>
        </div>
      )}

      {/* Quick Access */}
      {!query && (
        <div className="px-6">
          <h3 className="text-sm font-medium text-foreground mb-3">מילים פופולריות</h3>
          <div className="flex flex-wrap gap-2">
            {dictionary.slice(0, 8).map((word) => (
              <button
                key={word.id}
                onClick={() => setQuery(direction === 'hebrew-to-aramaic' ? word.hebrew : word.aramaic)}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:border-primary/20 transition-all"
              >
                {direction === 'hebrew-to-aramaic' ? word.hebrew : word.aramaic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Translator;
