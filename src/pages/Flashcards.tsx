import { useState, useEffect, useRef } from 'react';
import { Check, RotateCcw, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useDictionary, DictionaryWord } from '@/contexts/DictionaryContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useUserWords } from '@/hooks/useUserWords';
import { useAuth } from '@/contexts/AuthContext';
import QuizTriggerDialog from '@/components/QuizTriggerDialog';


const Flashcards = () => {
  const { dictionary, markAsLearned: markAsLearnedLocal, resetProgress } = useDictionary();
  const { user } = useAuth();
  const { markWordAsLearned, isWordLearned, loading: wordsLoading } = useUserWords();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [isMarking, setIsMarking] = useState(false);
  const [quizTriggerOpen, setQuizTriggerOpen] = useState(false);
  const learnedThisSession = useRef(0);
  

  // Filter out words that are already learned (from DB if logged in, or local state)
  useEffect(() => {
    if (wordsLoading) return;
    
    const unlearnedWords = dictionary.filter(word => {
      if (user) {
        return !isWordLearned(word.id);
      }
      return !word.learned;
    });
    setWords(unlearnedWords);
    setCurrentIndex(0);
  }, [dictionary, user, isWordLearned, wordsLoading]);

  const currentWord = words[currentIndex];
  const totalWords = words.length;
  const progress = totalWords > 0 ? ((currentIndex) / totalWords) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };


  const handleMarkLearned = async () => {
    if (!currentWord || isMarking) return;
    
    setIsMarking(true);
    
    // Update local state
    markAsLearnedLocal(currentWord.id);
    
    // If user is logged in, save to database
    if (user) {
      const success = await markWordAsLearned(currentWord.id);
      if (success) {
        toast({
          title: '🎉 מצוין!',
          description: 'המילה נשמרה כנלמדה בפרופיל שלך',
        });
      } else {
        toast({
          title: 'מצוין!',
          description: 'המילה סומנה כנלמדה',
        });
      }
    } else {
      toast({
        title: 'מצוין!',
        description: 'התחבר כדי לשמור את ההתקדמות שלך',
      });
    }
    
    setIsMarking(false);
    setIsFlipped(false);
    
    // Track session learned count for quiz trigger
    learnedThisSession.current += 1;
    if (learnedThisSession.current === 4) {
      setQuizTriggerOpen(true);
    }
    
    // Remove from current list and move to next
    setWords(prev => prev.filter(w => w.id !== currentWord.id));
    if (currentIndex >= words.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const handleReset = () => {
    resetProgress();
    setCurrentIndex(0);
    setIsFlipped(false);
    toast({
      title: 'ההתקדמות אופסה',
      description: 'כל המילים זמינות ללמידה מחדש',
    });
  };

  if (totalWords === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="כרטיסיות" subtitle="למד מילים חדשות" />
        <div className="px-6 flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">כל הכבוד!</h3>
          <p className="text-muted-foreground text-center mb-6">
            למדת את כל המילים במאגר
          </p>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="w-4 h-4 ml-2" />
            התחל מחדש
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="כרטיסיות" subtitle="לחץ על הכרטיס להפוך" />

      {/* Progress Bar */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">התקדמות</span>
          <span className="text-sm font-medium text-foreground">
            {currentIndex + 1} מתוך {totalWords}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      {currentWord && (
        <div className="px-6 mb-8">
          <div
            onClick={handleFlip}
            className="relative w-full aspect-[3/4] max-h-[400px] cursor-pointer perspective-1000"
          >
            <div 
              className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden">
                <div className="w-full h-full bg-gradient-to-br from-card to-card/95 rounded-3xl shadow-elegant border border-border flex flex-col items-center justify-center p-8">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
                    {currentWord.type}
                  </span>
                  <p className="text-4xl font-display font-bold text-foreground mb-4">
                    {currentWord.aramaic}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    לחץ לראות את התרגום
                  </p>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-muted animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl shadow-elegant border border-primary/20 flex flex-col items-center justify-center p-8">
                  <span className="text-xs font-medium text-muted-foreground mb-2">
                    {currentWord.aramaic}
                  </span>
                  <p className="text-4xl font-display font-bold text-primary mb-6">
                    {currentWord.hebrew}
                  </p>
                  <div className="bg-card/80 rounded-xl p-4 max-w-full">
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                      {currentWord.culturalContext}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 space-y-3">
        <Button 
          onClick={handleMarkLearned}
          className="w-full h-14 text-lg"
          disabled={isMarking}
        >
          <Check className="w-5 h-5 mr-2" />
          {isMarking ? 'שומר...' : 'סימנתי כנלמד'}
        </Button>
      </div>
      <QuizTriggerDialog open={quizTriggerOpen} onOpenChange={setQuizTriggerOpen} />
    </div>
  );
};

export default Flashcards;
