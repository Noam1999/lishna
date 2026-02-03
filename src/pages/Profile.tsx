import { useNavigate } from 'react-router-dom';
import { 
  Flame, Trophy, BookOpen, Calendar, Target, 
  Settings, LogOut, ChevronLeft 
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserWords } from '@/hooks/useUserWords';

const DAILY_GOAL = 50; // XP goal per day

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();
  const { learnedCount, loading: wordsLoading } = useUserWords();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !profile) {
    navigate('/auth');
    return null;
  }

  const memberSince = new Date(profile.created_at).getFullYear();
  const dailyProgress = Math.min((profile.daily_xp / DAILY_GOAL) * 100, 100);

  // Use real-time learned count from user_words table
  const wordsMasteredDisplay = wordsLoading ? profile.words_mastered : learnedCount;

  const stats = [
    { 
      icon: Trophy, 
      label: 'נקודות', 
      value: profile.points.toLocaleString(),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    { 
      icon: Flame, 
      label: 'רצף ימים', 
      value: profile.streak,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    { 
      icon: BookOpen, 
      label: 'מילים נלמדו', 
      value: wordsMasteredDisplay,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with back button */}
      <div className="relative px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 right-6 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-soft z-10"
        >
          <ChevronLeft className="w-5 h-5 text-foreground rotate-180" />
        </button>
        
        <button
          onClick={() => {}}
          className="absolute top-6 left-6 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-soft z-10"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="pt-16 pb-8 px-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-elegant">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-primary-foreground">
              {(profile.display_name || user.email || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          {profile.display_name || 'לומד חדש'}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Calendar className="w-4 h-4" />
          חבר מאז {memberSince}
        </p>
      </div>

      {/* Daily Goal Progress */}
      <div className="px-6 mb-6">
        <div className="bg-card rounded-2xl p-5 shadow-elegant border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">יעד יומי</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {profile.daily_xp} / {DAILY_GOAL} XP
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          {dailyProgress >= 100 && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              ✨ כל הכבוד! השגת את היעד היומי!
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, label, value, color, bgColor }) => (
            <div 
              key={label}
              className="bg-card rounded-xl p-4 shadow-soft border border-border text-center"
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-full ${bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="px-6 mb-6">
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
      </div>

      {/* Sign Out Button */}
      <div className="px-6">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 ml-2" />
          התנתקות
        </Button>
      </div>
    </div>
  );
};

export default Profile;
