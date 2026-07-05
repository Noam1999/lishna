import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vibrate } from 'lucide-react';
import { isHapticEnabled, setHapticEnabled, haptic } from '@/lib/haptics';
import { ArrowRight, Sun, Moon, Trophy, BookOpen, MessageCircle, Send, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserWords } from '@/hooks/useUserWords';
import { useDictionary } from '@/contexts/DictionaryContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import AdminPanel from '@/components/settings/AdminPanel';
import QuizTimerSetting from '@/components/settings/QuizTimerSetting';
import NotificationSettings from '@/components/settings/NotificationSettings';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const feedbackTypes = [
  { value: 'bug', label: 'באג 🐛', icon: Bug },
  { value: 'idea', label: 'רעיון 💡', icon: Lightbulb },
  { value: 'general', label: 'משוב כללי 💬', icon: MessageSquare },
] as const;

const getRank = (points: number): { name: string; emoji: string; minPoints: number; nextPoints: number } => {
  if (points >= 5000) return { name: 'גאון', emoji: '👑', minPoints: 5000, nextPoints: 5000 };
  if (points >= 3000) return { name: 'ראש ישיבה', emoji: '🏛️', minPoints: 3000, nextPoints: 5000 };
  if (points >= 2000) return { name: 'אריה דאורייתא', emoji: '🦁', minPoints: 2000, nextPoints: 3000 };
  if (points >= 1000) return { name: 'חברותא', emoji: '🤝', minPoints: 1000, nextPoints: 2000 };
  if (points >= 500) return { name: 'תלמיד חכם', emoji: '📖', minPoints: 500, nextPoints: 1000 };
  if (points >= 200) return { name: 'בר אוריין', emoji: '📜', minPoints: 200, nextPoints: 500 };
  if (points >= 50) return { name: 'תלמיד', emoji: '✏️', minPoints: 50, nextPoints: 200 };
  return { name: 'מתחיל', emoji: '🌱', minPoints: 0, nextPoints: 50 };
};

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { learnedCount } = useUserWords();
  const { dictionary } = useDictionary();
  const totalWords = dictionary.length;
  const masteryPercent = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [type, setType] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [hapticOn, setHapticOn] = useState<boolean>(() => isHapticEnabled());

  useEffect(() => {
    setHapticEnabled(hapticOn);
  }, [hapticOn]);

  const rank = getRank(profile?.points || 0);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('אנא כתוב הודעה');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        feedback_type: type,
        message: message.trim(),
        email: email.trim() || null,
      } as any);
      if (error) throw error;
      toast.success('תודה על המשוב! 🙏');
      setMessage('');
      setEmail('');
      setType('general');
      setFeedbackOpen(false);
    } catch {
      toast.error('שגיאה בשליחה, נסה שוב');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">הגדרות</h1>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Appearance Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">תצוגה</h2>
          
          {/* Dark Mode Toggle */}
          <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="font-semibold text-foreground">מצב כהה</h3>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'מצב כהה פעיל' : 'מצב בהיר פעיל'}
                  </p>
                </div>
                {theme === 'dark' ? (
                  <Moon className="w-6 h-6 text-primary" />
                ) : (
                  <Sun className="w-6 h-6 text-primary" />
                )}
              </div>
            </div>
          </div>

          {/* Quiz Timer */}
          <QuizTimerSetting />

          {/* Push Notifications */}
          <NotificationSettings />

          {/* Haptic Feedback Toggle */}
          <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
            <div className="flex items-center justify-between">
              <Switch
                checked={hapticOn}
                onCheckedChange={(v) => {
                  setHapticOn(v);
                  if (v) {
                    // Give a small confirmation buzz when enabling
                    setTimeout(() => haptic(15), 0);
                  }
                }}
              />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="font-semibold text-foreground">רטט מגע</h3>
                  <p className="text-sm text-muted-foreground">
                    {hapticOn ? 'רטט קל בכל לחיצה' : 'הרטט כבוי'}
                  </p>
                </div>
                <Vibrate className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* User Stats Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">סטטיסטיקות</h2>
          
          <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-4">
            {/* Rank */}
            <div className="flex items-center gap-4 bg-gradient-to-l from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground">דרגה נוכחית</p>
                <p className="text-xl font-bold text-primary">
                  <span className="ml-1">{rank.emoji}</span>
                  {rank.name}
                </p>
                {rank.nextPoints > rank.minPoints && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{rank.nextPoints} נק׳</span>
                      <span>{profile?.points || 0} נק׳</span>
                    </div>
                    <Progress 
                      value={((profile?.points || 0) - rank.minPoints) / (rank.nextPoints - rank.minPoints) * 100} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {rank.nextPoints - (profile?.points || 0)} נקודות לדרגה הבאה
                    </p>
                  </div>
                )}
              </div>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {rank.emoji}
              </div>
            </div>

            {/* Words Mastery Progress */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">{masteryPercent}%</span>
                <span className="text-sm font-medium text-foreground">שליטה במילים</span>
              </div>
              <Progress value={masteryPercent} className="h-3 mb-2" />
              <p className="text-xs text-muted-foreground text-right">
                {user ? learnedCount : 0} מתוך {totalWords} מילים נלמדו
              </p>
            </div>

            {/* Words & Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <BookOpen className="w-5 h-5 mx-auto mb-1 text-accent-foreground" />
                <p className="text-xl font-bold text-foreground">{user ? learnedCount : 0}</p>
                <p className="text-xs text-muted-foreground">מילים שנלמדו</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold text-foreground">{profile?.points || 0}</p>
                <p className="text-xs text-muted-foreground">סה״כ נקודות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Us */}
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
          <Button onClick={() => setFeedbackOpen(true)} className="w-full gap-2" variant="outline">
            <MessageCircle className="w-5 h-5" />
            צור קשר / שלח משוב
          </Button>
        </div>

        {/* Admin Panel */}
        <AdminPanel />
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right text-lg">שלח משוב 📬</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2 justify-end">
              {feedbackTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ספר לנו מה אתה חושב..."
              className="min-h-[120px] text-right resize-none"
              maxLength={1000}
              dir="rtl"
            />
            {!user && (
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="אימייל ליצירת קשר (אופציונלי)"
                type="email"
                className="text-right"
                dir="rtl"
              />
            )}
            <Button
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
              className="w-full gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'שולח...' : 'שלח משוב'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Settings;
