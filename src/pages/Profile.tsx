import { useNavigate } from 'react-router-dom';
import { 
  Flame, Trophy, BookOpen, Calendar, Target, 
  Settings, LogOut, ChevronLeft, Award, Zap, Star,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserWords } from '@/hooks/useUserWords';
import { useAchievements } from '@/hooks/useAchievements';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import UserAvatar from '@/components/UserAvatar';
import { Link } from 'react-router-dom';
import { Shirt } from 'lucide-react';


const DAILY_GOAL = 50;

// Level system
const LEVELS = [
  { name: 'תלמיד', minXP: 0 },
  { name: 'תנא', minXP: 500 },
  { name: 'אמורא', minXP: 1500 },
  { name: 'סבורא', minXP: 3000 },
  { name: 'גאון', minXP: 5000 },
];

const getCurrentLevel = (points: number) => {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  return { current, next };
};

const spring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const { learnedCount, loading: wordsLoading } = useUserWords();
  const { achievements, loading: achievementsLoading } = useAchievements();
  const [progressValue, setProgressValue] = useState(0);
  

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Check if user has completed today's streak
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedToday = profile?.last_quiz_date
    ? new Date(profile.last_quiz_date).toISOString().split('T')[0] === today
    : false;

  // Animate progress bar on mount
  useEffect(() => {
    if (profile) {
      const { current, next } = getCurrentLevel(profile.points);
      if (next) {
        const range = next.minXP - current.minXP;
        const progress = ((profile.points - current.minXP) / range) * 100;
        const timer = setTimeout(() => setProgressValue(Math.min(progress, 100)), 300);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setProgressValue(100), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen glass-backdrop pb-24 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user || !profile) {
    navigate('/auth');
    return null;
  }

  const memberSince = new Date(profile.created_at).getFullYear();
  const wordsMasteredDisplay = wordsLoading ? profile.words_mastered : learnedCount;
  const { current: currentLevel, next: nextLevel } = getCurrentLevel(profile.points);

  const stats = [
    { 
      icon: Trophy, 
      label: 'סך הכל נקודות', 
      value: profile.points.toLocaleString(),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    { 
      icon: BookOpen, 
      label: 'מילים שנלמדו', 
      value: wordsMasteredDisplay,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    { 
      icon: Target, 
      label: 'מבחנים שהושלמו', 
      value: profile.last_quiz_date ? '✓' : '0',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    { 
      icon: Flame, 
      label: 'שיא רצף', 
      value: profile.streak,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: spring
    }
  };

  const slideDown = {
    hidden: { opacity: 0, y: -40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
        mass: 1,
      }
    }
  };

  return (
    <div className="min-h-screen glass-backdrop pb-24 overflow-x-hidden">
      {/* Header buttons */}
      <div className="relative px-6 pt-6 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={spring}
          onClick={() => { toast('בקרוב! אנחנו עובדים על זה 🚧'); }}
          className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-soft"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={spring}
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-soft"
        >
          <ChevronLeft className="w-5 h-5 text-foreground rotate-180" />
        </motion.button>
      </div>

      {/* Profile Header with slide-down bounce */}
      <motion.div
        variants={slideDown}
        initial="hidden"
        animate="visible"
        className="pt-8 pb-6 px-6 text-center"
      >
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className="w-28 h-28 mx-auto mb-4"
        >
          <UserAvatar userId={user.id} size={112} className="shadow-elegant" />
        </motion.div>

        <Link
          to="/wardrobe"
          className="inline-flex items-center gap-1.5 mb-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full px-3 py-1 text-xs font-semibold text-primary transition-colors"
        >
          <Shirt className="w-3.5 h-3.5" />
          החלף תלבושת
        </Link>

        {/* Name */}
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          {profile.display_name || 'לומד חדש'}
        </h1>

        {/* Streak flame row with pulse */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <motion.div
            animate={!hasCompletedToday ? {
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex items-center gap-1"
          >
            <span className="text-xl">🔥</span>
            <span className="text-xl">🔥</span>
            <span className="text-xl">🔥</span>
          </motion.div>
          <span className="text-lg font-bold text-foreground">{profile.streak} ימים</span>
        </div>

        {/* Level badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...spring, delay: 0.4 }}
          className="inline-flex items-center gap-1.5 mt-3 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5"
        >
          <Star className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">דרגת {currentLevel.name}</span>
        </motion.div>

        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
          <Calendar className="w-3.5 h-3.5" />
          חבר מאז {memberSince}
        </p>
      </motion.div>

      {/* Level Progress Bar */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.5 }}
          className="bg-card rounded-2xl p-5 shadow-elegant border border-border"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground text-sm">
                {nextLevel ? `בדרך לדרגת ${nextLevel.name}` : 'הגעת לדרגה הגבוהה ביותר!'}
              </span>
            </div>
            {nextLevel && (
              <span className="text-xs text-muted-foreground">
                {profile.points} / {nextLevel.minXP} XP
              </span>
            )}
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
              className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full relative"
            >
              {/* Shimmer effect on progress bar */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid - 2x2 with staggered fade-in */}
      <div className="px-6 mb-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {stats.map(({ icon: Icon, label, value, color, bgColor, borderColor }) => (
            <motion.div
              key={label}
              variants={cardVariants}
              whileHover={{ scale: 1.05, boxShadow: '0 8px 30px -8px hsl(174 58% 35% / 0.25)' }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              className={`bg-card rounded-2xl p-5 shadow-soft border ${borderColor} text-center cursor-default`}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Daily Goal */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.8 }}
          className="bg-card rounded-2xl p-5 shadow-elegant border border-border"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">יעד יומי</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {profile.daily_xp} / {DAILY_GOAL} XP
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min((profile.daily_xp / DAILY_GOAL) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 1 }}
              className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full"
            />
          </div>
          {profile.daily_xp >= DAILY_GOAL && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-xs text-primary mt-2 flex items-center gap-1"
            >
              ✨ כל הכבוד! השגת את היעד היומי!
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-lg">הישגים</h3>
            {!achievementsLoading && (
              <span className="text-xs text-muted-foreground">
                ({achievements.filter(a => a.unlocked).length}/{achievements.length})
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: 1.1 + index * 0.08 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center p-3 rounded-2xl border text-center transition-colors ${
                  achievement.unlocked
                    ? 'bg-card border-primary/30 shadow-soft'
                    : 'bg-muted/50 border-border grayscale opacity-50'
                }`}
              >
                {/* Shimmer overlay for unlocked */}
                {achievement.unlocked && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/10 to-transparent animate-[shimmer_3s_infinite] -translate-x-full" />
                  </div>
                )}
                <span className={`text-2xl mb-1 ${!achievement.unlocked ? 'blur-[1px]' : ''}`}>
                  {achievement.icon}
                </span>
                <span className="text-[10px] font-semibold text-foreground leading-tight">
                  {achievement.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 1.2 }}
        className="px-6 mb-6"
      >
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
          <h3 className="font-semibold text-foreground mb-4">פרטי חשבון</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">אימייל</span>
              <span className="text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">שם משתמש</span>
              <span className="text-foreground">{profile.username || 'לא הוגדר'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="px-6"
      >
        <motion.div whileTap={{ scale: 0.97 }} transition={spring}>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 ml-2" />
            התנתקות
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
