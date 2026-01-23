import { Link, useNavigate } from 'react-router-dom';
import { Book, GraduationCap, Brain, ScrollText, Sparkles, User, LogIn } from 'lucide-react';
import Header from '@/components/Header';
import { useDictionary } from '@/contexts/DictionaryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

const Home = () => {
  const navigate = useNavigate();
  const { dictionary, getUnlearnedWords } = useDictionary();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const learnedCount = dictionary.filter(w => w.learned).length;
  const progress = Math.round((learnedCount / dictionary.length) * 100);

  const features = [
    {
      path: '/translator',
      icon: Book,
      title: 'תרגומון',
      description: 'חפש וגלה מילים בארמית בבלית',
      color: 'bg-primary/10 text-primary',
    },
    {
      path: '/flashcards',
      icon: GraduationCap,
      title: 'כרטיסיות',
      description: 'למד מילים חדשות עם כרטיסיות הפיכות',
      color: 'bg-secondary text-secondary-foreground',
    },
    {
      path: '/quiz',
      icon: Brain,
      title: 'מבחן',
      description: 'בחן את הידע שלך בחידון אמריקאי',
      color: 'bg-accent text-accent-foreground',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 pt-12 pb-8 px-6 text-center">
          {/* User Auth/Profile Button */}
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-primary to-primary/60 border border-border rounded-full flex items-center justify-center shadow-soft hover:shadow-elegant transition-all"
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">
                  {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </button>
          ) : (
            <Link
              to="/auth"
              className="absolute top-4 left-4 w-10 h-10 bg-card/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-soft hover:shadow-elegant transition-all"
            >
              <LogIn className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
          
          <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 mb-6 shadow-soft">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">למד ארמית בבלית</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <ScrollText className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">
              לִישָׁנָא דְּאוֹרַיְיתָא
            </h1>
          </div>
          
          <p className="text-muted-foreground max-w-xs mx-auto">
            שער לשפת התלמוד הבבלי - למד, תרגם והבן את לשון חז"ל
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="px-6 -mt-2 mb-6">
        <div className="bg-card rounded-2xl p-5 shadow-elegant border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">התקדמות הלימוד</span>
            <span className="text-sm text-muted-foreground">{learnedCount} מתוך {dictionary.length} מילים</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {getUnlearnedWords().length > 0 
              ? `נותרו ${getUnlearnedWords().length} מילים ללמידה`
              : 'כל הכבוד! למדת את כל המילים! 🎉'}
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="px-6 space-y-4">
        {features.map(({ path, icon: Icon, title, description, color }) => (
          <Link
            key={path}
            to={path}
            className="group block bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-elegant hover:border-primary/20 transition-all duration-300"
          >
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
        ))}
      </div>

      {/* Daily Word */}
      <div className="px-6 mt-8">
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">מילת היום</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-foreground mb-1">גְּמָרָא</p>
            <p className="text-muted-foreground">לִימוּד / מַסְקָנָה</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              שם כולל לתלמוד הבבלי, מלשון גמר - השלמה
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
