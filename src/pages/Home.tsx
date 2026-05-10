import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, GraduationCap, Brain, ScrollText, Sparkles, LogIn, Flame, Rss, Trophy, Settings, School, ShoppingBag } from 'lucide-react';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import Header from '@/components/Header';
import DailyQuests from '@/components/DailyQuests';
import StreakLockDialog from '@/components/StreakLockDialog';
import { useDictionary } from '@/contexts/DictionaryContext';
import HomeLeaderboard from '@/components/HomeLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserWords } from '@/hooks/useUserWords';
import { useGuestWarning } from '@/hooks/useGuestWarning';



const Home = () => {
  const navigate = useNavigate();
  const { dictionary, getUnlearnedWords } = useDictionary();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { learnedCount: dbLearnedCount, loading: wordsLoading } = useUserWords();
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  
  

  // Check if user has completed today's streak (did a quiz today)
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedToday = profile?.last_quiz_date
    ? new Date(profile.last_quiz_date).toISOString().split('T')[0] === today
    : false;
  const shouldPulseFlame = user ? !hasCompletedToday : true;
  useGuestWarning();

  // Use DB count if logged in, otherwise use local count
  const learnedCount = user && !wordsLoading ? dbLearnedCount : dictionary.filter((w) => w.learned).length;
  const progress = Math.round(learnedCount / dictionary.length * 100);

  const features = [
  {
    path: '/translator',
    icon: Book,
    title: 'תרגומון',
    description: 'חפש וגלה מילים בארמית בבלית',
    color: 'bg-primary/10 text-primary'
  },
  {
    path: '/flashcards',
    icon: GraduationCap,
    title: 'כרטיסיות',
    description: 'למד מילים חדשות עם כרטיסיות הפיכות',
    color: 'bg-secondary text-secondary-foreground'
  },
  {
    path: '/quiz',
    icon: Brain,
    title: 'מבחן',
    description: 'בחן את הידע שלך בחידון אמריקאי',
    color: 'bg-accent text-accent-foreground'
  }];


  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 pt-12 pb-8 px-6 text-center">
          {/* User Auth/Profile Button */}
          {user ?
          <button
            onClick={() => { navigate('/profile'); }}
            className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-primary to-primary/60 border border-border rounded-full flex items-center justify-center shadow-soft hover:shadow-elegant transition-all">

              {profile?.avatar_url ?
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover" /> :


            <span className="text-sm font-bold text-primary-foreground">
                  {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
                </span>
            }
            </button> :

          <Link
            to="/auth"
            className="absolute top-4 left-4 w-10 h-10 bg-primary border-2 border-primary/50 rounded-full flex items-center justify-center shadow-elegant hover:scale-110 transition-all animate-pulse">

              <LogIn className="w-5 h-5 text-primary-foreground" />
            </Link>
          }

          {/* Settings Gear */}
          <button
            onClick={() => { navigate('/settings'); }}
            className="absolute top-4 left-16 w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft hover:shadow-elegant transition-all hover:scale-105"
            aria-label="הגדרות"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Top-right: Streak flame + Points */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {profile && user &&
            <Link to="/shop" className="flex items-center gap-1 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-soft hover:scale-105 transition-all">
                <span className="text-sm">💰</span>
                <span className="text-xs font-bold text-foreground">{profile.coins}</span>
              </Link>
            }
            {profile && user &&
            <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-soft">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{profile.points}</span>
              </div>
            }
            <button
              onClick={() => {
                if (!user) {
                  setStreakDialogOpen(true);
                }
              }}
              className={`relative w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft hover:shadow-elegant transition-all ${shouldPulseFlame ? 'animate-pulse' : ''}`}>

              <Flame className={`w-5 h-5 ${hasCompletedToday ? 'text-primary' : 'text-destructive'}`} />
              {profile && user &&
              <span className="absolute -bottom-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {profile.streak}
                </span>
              }
            </button>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 mb-6 shadow-soft">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">למד ארמית בבלית</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            <ScrollText className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">
              לִישָׁנָא
            </h1>
          </div>

          <p className="text-sm font-medium text-primary mb-1">ארמית. פשוט להבין.</p>
          
          <p className="text-muted-foreground text-xs max-w-xs mx-auto">המפתח שלך לשפת הגמרא אצלכם בכיס! למדו ארמית  עם תחרויות ומשימות יומיות.

          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-6 -mt-2 mb-6">
        <div className="bg-card rounded-2xl p-5 shadow-elegant border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">התקדמות הלימוד</span>
            <span className="text-sm text-muted-foreground">
              {wordsLoading && user ? '...' : learnedCount} מתוך {dictionary.length} מילים
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }} />

          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {learnedCount >= dictionary.length ?
            'כל הכבוד! למדת את כל המילים! 🎉' :
            `נותרו ${dictionary.length - learnedCount} מילים ללמידה`}
          </p>
        </div>
      </div>

      {/* Daily Quests */}
      <DailyQuests />

      {/* Feature Cards */}
      <div className="px-6 space-y-4">
        {features.map(({ path, icon: Icon, title, description, color }) =>
        <Link
          key={path}
          to={path}
          className="group block bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-elegant hover:border-primary/20 transition-all duration-300">

            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          </Link>
        )}
        {/* Classes Link */}
        <Link
          to="/classes"
          className="group block bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-elegant hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <School className="w-7 h-7" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-semibold text-lg text-foreground mb-1">כיתות</h3>
              <p className="text-sm text-muted-foreground">הצטרף לכיתה או נהל ככיתה כמורה</p>
            </div>
          </div>
        </Link>

        {/* Shop Link */}
        <Link
          to="/shop"
          className="group block bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl p-5 shadow-soft border border-yellow-500/30 hover:shadow-elegant transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-2xl">
              💰
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-semibold text-lg text-foreground mb-1">החנות של לישנא</h3>
              <p className="text-sm text-muted-foreground">קנה מכפילים וכוחות מיוחדים</p>
            </div>
          </div>
        </Link>

        {/* League Link */}
        <Link
          to="/leaderboard"
          className="group block bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-elegant hover:border-primary/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent text-accent-foreground flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-semibold text-lg text-foreground mb-1">ליגה</h3>
              <p className="text-sm text-muted-foreground">צפה בדירוג השבועי והתחרה בחברים</p>
            </div>
          </div>
        </Link>

        {/* Updates Link */}
        <Link
          to="/feed"
          className="group block bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-elegant hover:border-primary/20 transition-all duration-300">

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted text-muted-foreground flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Rss className="w-7 h-7" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-semibold text-lg text-foreground mb-1">עדכונים</h3>
              <p className="text-sm text-muted-foreground">צפה בפעילות החברים שלך</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Leaderboard Preview */}
      <HomeLeaderboard />

      {/* Daily Word */}
      {(() => {
        const start = new Date(new Date().getFullYear(), 0, 0);
        const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
        const wordOfDay = dictionary[dayOfYear % dictionary.length];
        if (!wordOfDay) return null;
        return (
          <div className="px-6 mt-8">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">מילת היום</span>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-bold text-foreground mb-1">{wordOfDay.aramaic}</p>
                <p className="text-muted-foreground">{wordOfDay.hebrew}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {wordOfDay.culturalContext}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
      <StreakLockDialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen} />
      <Footer />
    </div>
    </PageTransition>);

};

export default Home;