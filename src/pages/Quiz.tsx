import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, RotateCcw, BookOpen, CheckCircle, XCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Header from '@/components/Header';
import { useDictionary, DictionaryWord } from '@/contexts/DictionaryContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserWords } from '@/hooks/useUserWords';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyQuests } from '@/hooks/useDailyQuests';

interface QuizQuestion {
  word: DictionaryWord;
  options: string[];
  correctAnswer: string;
}

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPoints, updateQuizStreak, awardScoreRewards, usePowerUp5050, profile } = useProfile();
  const { dictionary, quizScore, setQuizScore, quizHistory, setQuizHistory } = useDictionary();
  const { learnedWordIds, loading: wordsLoading } = useUserWords();
  const { addWeeklyPoints } = useLeaderboard();
  const { checkAndUnlockAchievements } = useAchievements();
  const { updateQuestProgress } = useDailyQuests();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const hasUpdatedStreak = useRef(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [notEnoughWords, setNotEnoughWords] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [usedThisQuestion, setUsedThisQuestion] = useState(false);
  

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

  // Cleanup timeouts on unmount or question change
  useEffect(() => {
    return () => {
      hasUpdatedStreak.current = false;
    };
  }, [currentQuestion]);

  const handleAnswer = (answer: string) => {
    if (showResult) return;

    const correct = answer === questions[currentQuestion].correctAnswer;
    const currentQ = questions[currentQuestion];
    
    setSelectedAnswer(answer);
    setShowResult(true);
    setIsCorrect(correct);

    if (correct) {
      setQuizScore((prev) => prev + 1);
    }

    setQuizHistory((prev) => [
      ...prev,
      { word: currentQ.word, correct },
    ]);

    // Auto advance after delay
    const timeoutId = setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        // Reset state for next question
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
        setHiddenOptions([]);
        setUsedThisQuestion(false);
      } else {
        // Quiz finished - update profile stats
        if (user && !hasUpdatedStreak.current) {
          hasUpdatedStreak.current = true;
          // Use correct variable captured in closure, not stale quizScore
          const finalScore = correct ? (quizScore + 1) : quizScore;
          const pointsEarned = Math.round((finalScore / questions.length) * 100);
          // Award coins + XP (with multipliers); replaces addPoints
          await awardScoreRewards(pointsEarned);
          await addWeeklyPoints(pointsEarned);
          await updateQuizStreak();
          await checkAndUnlockAchievements();
          // Update daily quest progress
          await updateQuestProgress('complete_quizzes', 1);
          await updateQuestProgress('earn_points', pointsEarned);
        }
        navigate('/quiz-summary');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
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
          
          let buttonClass = 'w-full h-14 text-lg justify-start px-6 transition-all duration-200 ';
          
          if (showResult) {
            if (isCorrectAnswer) {
              buttonClass += 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 ring-2 ring-green-400/50';
            } else if (isSelected && !isCorrect) {
              buttonClass += 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 ring-2 ring-red-400/50';
            } else {
              buttonClass += 'opacity-40';
            }
          } else {
            buttonClass += 'hover:bg-accent active:scale-[0.97]';
          }

          return (
            <motion.div
              key={`${currentQuestion}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={buttonClass}
                type="button"
              >
                <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ml-4 text-sm font-medium flex-shrink-0">
                  {['א', 'ב', 'ג', 'ד'][index]}
                </span>
                <span className="flex-1 text-right">{option}</span>
                {showResult && isCorrectAnswer && (
                  <CheckCircle className="ml-2 w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <XCircle className="ml-2 w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Answer Feedback Banner */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative mx-6 mt-4"
          >
            {/* Confetti particles for correct answers */}
            {isCorrect && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'][i % 6],
                      left: `${10 + (i * 7)}%`,
                      top: '50%',
                    }}
                    initial={{ y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      y: [0, -40 - Math.random() * 30, 20],
                      x: [0, (i % 2 === 0 ? 1 : -1) * (10 + Math.random() * 20)],
                      opacity: [1, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{ duration: 0.8, delay: i * 0.04 }}
                  />
                ))}
              </div>
            )}
            <div
              className={`p-4 rounded-xl text-center font-medium ${
                isCorrect
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
              }`}
            >
              {isCorrect ? (
                <motion.span
                  className="flex items-center justify-center gap-2 text-lg"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.15, 1] }}
                  transition={{ duration: 0.4 }}
                >
                  <CheckCircle className="w-6 h-6" />
                  נכון מאוד! 🎉
                </motion.span>
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <span className="flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    לא נכון 😕
                  </span>
                  <span className="text-sm">
                    התשובה הנכונה: <strong>{currentQ.correctAnswer}</strong>
                  </span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
