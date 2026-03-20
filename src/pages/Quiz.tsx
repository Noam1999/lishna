import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, RotateCcw, BookOpen } from 'lucide-react';

import Header from '@/components/Header';
import { useDictionary, DictionaryWord } from '@/contexts/DictionaryContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserWords } from '@/hooks/useUserWords';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAchievements } from '@/hooks/useAchievements';

interface QuizQuestion {
  word: DictionaryWord;
  options: string[];
  correctAnswer: string;
}

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPoints, updateQuizStreak } = useProfile();
  const { dictionary, quizScore, setQuizScore, quizHistory, setQuizHistory } = useDictionary();
  const { learnedWordIds, loading: wordsLoading } = useUserWords();
  const { addWeeklyPoints } = useLeaderboard();
  const { checkAndUnlockAchievements } = useAchievements();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const hasUpdatedStreak = useRef(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [notEnoughWords, setNotEnoughWords] = useState(false);
  

  const TOTAL_QUESTIONS = 10;
  const MIN_WORDS_FOR_QUIZ = 4; // Minimum words needed for a quiz (1 correct + 3 wrong options)

  const generateQuestions = useCallback(() => {
    // Filter dictionary to only include learned words
    const learnedWords = user 
      ? dictionary.filter(word => learnedWordIds.has(word.id))
      : dictionary.filter(word => word.learned);

    // Check if we have enough words for a quiz
    if (learnedWords.length < MIN_WORDS_FOR_QUIZ) {
      setNotEnoughWords(true);
      setQuestions([]);
      return;
    }

    setNotEnoughWords(false);
    
    const shuffled = [...learnedWords].sort(() => Math.random() - 0.5);
    const questionsCount = Math.min(TOTAL_QUESTIONS, learnedWords.length);
    const selected = shuffled.slice(0, questionsCount);

    const newQuestions: QuizQuestion[] = selected.map((word) => {
      const correctAnswer = word.hebrew;
      const otherWords = learnedWords
        .filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.hebrew);

      const options = [...otherWords, correctAnswer].sort(() => Math.random() - 0.5);

      return {
        word,
        options,
        correctAnswer,
      };
    });

    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setQuizScore(0);
    setQuizHistory([]);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [dictionary, setQuizScore, setQuizHistory, user, learnedWordIds]);

  useEffect(() => {
    if (!wordsLoading) {
      generateQuestions();
    }
  }, [generateQuestions, wordsLoading]);

  const handleAnswer = (answer: string) => {
    if (showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);
    const correct = answer === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      playSuccess();
      setQuizScore((prev) => prev + 1);
    } else {
      playError();
    }

    setQuizHistory((prev) => [
      ...prev,
      { word: questions[currentQuestion].word, correct },
    ]);

    // Auto advance after delay
    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Quiz finished - update profile stats
        if (user && !hasUpdatedStreak.current) {
          hasUpdatedStreak.current = true;
          const finalScore = correct ? quizScore + 1 : quizScore;
          const pointsEarned = Math.round((finalScore / questions.length) * 100);
          await addPoints(pointsEarned);
          await addWeeklyPoints(pointsEarned);
          await updateQuizStreak();
          await checkAndUnlockAchievements();
        }
        navigate('/quiz-summary');
      }
    }, 1500);
  };

  const currentQ = questions[currentQuestion];

  // Loading state
  if (wordsLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not enough learned words
  if (notEnoughWords) {
    const learnedCount = user 
      ? learnedWordIds.size 
      : dictionary.filter(w => w.learned).length;
    
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header title="מבחן" subtitle="בחן את הידע שלך" />
        <div className="px-6 flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">אין מספיק מילים</h3>
          <p className="text-muted-foreground text-center mb-2">
            כדי להתחיל מבחן, צריך ללמוד לפחות {MIN_WORDS_FOR_QUIZ} מילים בכרטיסיות
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            למדת עד כה: <span className="font-semibold text-primary">{learnedCount}</span> מילים
          </p>
          <Button asChild>
            <Link to="/flashcards">
              <BookOpen className="w-4 h-4 ml-2" />
              עבור לכרטיסיות
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="מבחן" subtitle="בחר את התשובה הנכונה" />

      {/* Score Display */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">{quizScore}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            שאלה {currentQuestion + 1} מתוך {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="px-6 mb-8">
        <div className="bg-card rounded-2xl p-6 shadow-elegant border border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">מה הפירוש של:</p>
          <p className="text-4xl font-display font-bold text-foreground">
            {currentQ.word.aramaic}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="px-6 space-y-3">
        {currentQ.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === currentQ.correctAnswer;
          
          let buttonClass = 'w-full h-14 text-lg justify-start px-6 ';
          
          if (showResult) {
            if (isCorrectAnswer) {
              buttonClass += 'bg-green-100 border-green-500 text-green-700 hover:bg-green-100';
            } else if (isSelected && !isCorrect) {
              buttonClass += 'bg-red-100 border-red-500 text-red-700 hover:bg-red-100';
            } else {
              buttonClass += 'opacity-50';
            }
          }

          return (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={buttonClass}
            >
              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ml-4 text-sm font-medium">
                {['א', 'ב', 'ג', 'ד'][index]}
              </span>
              {option}
              {showResult && isCorrectAnswer && (
                <span className="mr-auto text-green-600">✓</span>
              )}
              {showResult && isSelected && !isCorrect && (
                <span className="mr-auto text-red-600">✗</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Restart Button */}
      <div className="px-6 mt-8">
        <Button
          variant="ghost"
          onClick={generateQuestions}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 ml-2" />
          התחל מחדש
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
