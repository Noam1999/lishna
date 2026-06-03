import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, GraduationCap, Brain, ScrollText, Sparkles, LogIn, Flame, Rss, Trophy, Settings, School, ShoppingBag, Inbox, MessageCircle, Shirt } from 'lucide-react';
import { useUnreadMail } from '@/hooks/useUnreadMail';
import UserAvatar from '@/components/UserAvatar';
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
  const { count: unreadCount } = useUnreadMail();
  
  

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
        
        <div className="relative z-10 pt-6 pb-8 px-4">
          {/* Top toolbar — two clean rows of equally-sized chips for mobile */}
          <div className="flex items-center justify-between gap-2 mb-6">
            {/* Right group: profile + settings */}
            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="active:scale-95 transition-transform"
                  aria-label="פרופיל"
                >
                  <UserAvatar userId={user.id} size={40} />
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-elegant animate-pulse"
                  aria-label="התחבר"
                >
                  <LogIn className="w-5 h-5 text-primary-foreground" />
                </Link>
              )}
              <button
                onClick={() => navigate('/settings')}
                className="w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft active:scale-95 transition-transform"
                aria-label="הגדרות"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
              {user && (
                <Link
                  to="/inbox"
                  className="relative w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft active:scale-95 transition-transform"
                  aria-label="תיבת דואר"
                >
                  <Inbox className="w-5 h-5 text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              {user && (
                <Link
                  to="/chat"
                  className="w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft active:scale-95 transition-transform"
                  aria-label="צ'אט"
                >
                  <MessageCircle className="w-5 h-5 text-primary" />
                </Link>
              )}
            </div>

            {/* Left group: streak flame */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (!user) setStreakDialogOpen(true); }}
                className={`relative w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft ${shouldPulseFlame ? 'animate-pulse' : ''}`}
                aria-label="רצף"
              >
                <Flame className={`w-5 h-5 ${hasCompletedToday ? 'text-primary' : 'text-destructive'}`} />
                {profile && user && (
                  <span className="absolute -bottom-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {profile.streak}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Balance chips row — easy to read & tap on mobile */}
          {user && profile && (
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              <Link to="/shop" id="lishna-balance-coins" className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-soft active:scale-95 transition-transform">
                <span className="text-sm">💰</span>
                <span className="text-xs font-bold text-foreground">{profile.coins}</span>
              </Link>
              <Link to="/shop" id="lishna-balance-diamonds" className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-soft active:scale-95 transition-transform">
                <span className="text-sm">💎</span>
                <span className="text-xs font-bold text-foreground">{profile.diamonds}</span>
              </Link>
              <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-soft">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{profile.points}</span>
              </div>
            </div>
          )}


          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 mb-6 shadow-soft">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">למד ארמית בבלית</span>
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <ScrollText className="w-10 h-10 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">לִישָׁנָא</h1>
            </div>
            <p className="text-sm font-medium text-primary mb-1">ארמית. פשוט להבין.</p>
            <p className="text-muted-foreground text-xs max-w-xs mx-auto">המפתח שלך לשפת הגמרא אצלכם בכיס! למדו ארמית עם תחרויות ומשימות יומיות.</p>
          </div>
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

        {/* Wardrobe Link */}
        <Link
          to="/wardrobe"
          className="group block bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-2xl p-5 shadow-soft border border-purple-500/30 hover:shadow-elegant transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Shirt className="w-7 h-7" />
            </div>
            <div className="flex-1 text-right">
              <h3 className="font-semibold text-lg text-foreground mb-1">המלתחה שלי 🎒</h3>
              <p className="text-sm text-muted-foreground">קנה והלבש תלבושות אגדיות לדמות</p>
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