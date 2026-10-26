import { Link } from 'react-router-dom';
import { Trophy, RotateCcw, BookOpen, Check, X } from 'lucide-react';
import Header from '@/components/Header';
import GuestLeaderboardOverlay from '@/components/GuestLeaderboardOverlay';
import { useDictionary } from '@/contexts/DictionaryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const QuizSummary = () => {
  const { user } = useAuth();
  const { quizScore, quizHistory } = useDictionary();
  const totalQuestions = quizHistory.length;
  const percentage = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0;

  const getScoreMessage = () => {
    if (percentage >= 90) return { emoji: '🏆', text: 'מצוין! שליטה מלאה!' };
    if (percentage >= 70) return { emoji: '🌟', text: 'יפה מאוד! כמעט שם!' };
    if (percentage >= 50) return { emoji: '💪', text: 'לא רע! יש מקום לשיפור' };
    return { emoji: '📚', text: 'כדאי לחזור על החומר' };
  };

  const scoreMessage = getScoreMessage();

  // Calculate stroke dasharray for the circle
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen glass-backdrop pb-24">
      <Header title="סיכום מבחן" />

      {/* Score Circle */}
      <div className="px-6 py-8 flex flex-col items-center">
        <div className="relative w-48 h-48 mb-6 glass rounded-full p-0 animate-glass-in">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{quizScore}</span>
            <span className="text-muted-foreground">מתוך {totalQuestions}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="text-4xl mb-2 block">{scoreMessage.emoji}</span>
          <p className="text-xl font-semibold text-foreground">{scoreMessage.text}</p>
          <p className="text-muted-foreground mt-1">{percentage}% תשובות נכונות</p>
        </div>
      </div>

      {/* Results List */}
      <div className="px-6 mb-8">
        <h3 className="text-sm font-medium text-foreground mb-4">פירוט התשובות</h3>
        <div className="glass rounded-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {quizHistory.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border-b border-border last:border-b-0 ${
                  item.correct ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.correct ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {item.correct ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div className="flex-1 text-right mr-4">
                  <p className="font-medium text-foreground">{item.word.aramaic}</p>
                  <p className="text-sm text-muted-foreground">{item.word.hebrew}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guest Leaderboard Overlay */}
      {!user && <GuestLeaderboardOverlay />}

      {/* Action Buttons */}
      <div className="px-6 space-y-3 mt-6">
        <Link to="/quiz" className="block">
          <Button className="w-full h-14 text-lg rounded-full glass-teal glass-press">
            <RotateCcw className="w-5 h-5 ml-2" />
            מבחן חדש
          </Button>
        </Link>
        <Link to="/flashcards" className="block">
          <Button variant="outline" className="w-full h-12 rounded-full glass glass-press">
            <BookOpen className="w-5 h-5 ml-2" />
            חזרה ללמידה
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default QuizSummary;
