import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { toast as sonnerToast } from 'sonner';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import { lovable } from '@/integrations/lovable';

type AuthMode = 'login' | 'register';

const emailSchema = z.string().email('כתובת אימייל לא תקינה');
const passwordSchema = z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים');
const nameSchema = z.string().min(2, 'השם חייב להכיל לפחות 2 תווים');

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (mode === 'register') {
      try {
        nameSchema.parse(formData.name);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.name = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          let message = 'שגיאה בהתחברות';
          if (error.message.includes('Invalid login credentials')) {
            message = 'אימייל או סיסמה שגויים';
          }
          toast({
            title: 'שגיאה',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'התחברת בהצלחה!',
            description: 'ברוכים הבאים לעולם הארמית הבבלית',
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          let message = error.message || 'שגיאה בהרשמה';
          const m = error.message || '';
          if (m.includes('User already registered') || m.includes('already been registered') || m.toLowerCase().includes('already')) {
            message = 'משתמש כבר רשום עם אימייל זה';
          } else if (m.toLowerCase().includes('weak') || m.toLowerCase().includes('pwned') || m.toLowerCase().includes('leaked')) {
            message = 'הסיסמה חלשה או דלופה. בחר סיסמה חזקה יותר';
          } else if (m.toLowerCase().includes('password')) {
            message = 'הסיסמה חייבת להכיל לפחות 6 תווים';
          } else if (m.toLowerCase().includes('email') && m.toLowerCase().includes('invalid')) {
            message = 'כתובת האימייל אינה תקינה';
          } else if (m.toLowerCase().includes('rate')) {
            message = 'יותר מדי ניסיונות, נסה שוב בעוד רגע';
          } else if (m.toLowerCase().includes('database') || m.toLowerCase().includes('saving new user')) {
            message = 'שגיאה בשמירת המשתמש, נסה שוב';
          }
          toast({
            title: 'שגיאה',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'נרשמת בהצלחה!',
            description: 'ברוכים הבאים לעולם הארמית הבבלית',
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: 'שגיאה',
        description: 'משהו השתבש, נסה שוב',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({
          title: 'שגיאה',
          description: 'שגיאה בהתחברות עם גוגל',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate('/');
    } catch {
      toast({ title: 'שגיאה', description: 'שגיאה בהתחברות עם גוגל', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with illustration */}
      <div className="relative pt-12 pb-8 px-6">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl transform rotate-6" />
            <div className="absolute inset-0 bg-card rounded-2xl shadow-elegant border border-border flex items-center justify-center p-2">
              <Logo className="w-16 h-16" />
            </div>
          </div>
          
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            לִישָׁנָא דְּאוֹרַיְיתָא
          </h1>
          <p className="text-muted-foreground text-sm">
            שער לשפת התלמוד הבבלי
          </p>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="px-6 mb-6">
        <div className="bg-muted rounded-xl p-1.5 flex gap-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === 'login'
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            התחברות
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
              mode === 'register'
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            הרשמה
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="space-y-4" dir="ltr">
          {mode === 'register' && (
            <div className="space-y-1">
              <div className={`flex items-center gap-3 h-12 bg-card border rounded-xl px-3 animate-fade-in focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background ${errors.name ? 'border-destructive' : 'border-border'}`}>
                <User className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="שם מלא"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 h-full bg-transparent border-0 outline-none text-right text-foreground placeholder:text-muted-foreground"
                  dir="rtl"
                />
              </div>
              {errors.name && <p className="text-xs text-destructive text-right">{errors.name}</p>}
            </div>
          )}
          
          <div className="space-y-1">
            <div className={`flex items-center gap-3 h-12 bg-card border rounded-xl px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background ${errors.email ? 'border-destructive' : 'border-border'}`}>
              <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="email"
                placeholder="דואר אלקטרוני"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="flex-1 h-full bg-transparent border-0 outline-none text-right text-foreground placeholder:text-muted-foreground"
                dir="rtl"
              />
            </div>
            {errors.email && <p className="text-xs text-destructive text-right">{errors.email}</p>}
          </div>
          
          <div className="space-y-1">
            <div className={`flex items-center gap-3 h-12 bg-card border rounded-xl px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background ${errors.password ? 'border-destructive' : 'border-border'}`}>
              <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="סיסמה"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 h-full bg-transparent border-0 outline-none text-right text-foreground placeholder:text-muted-foreground"
                dir="rtl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive text-right">{errors.password}</p>}
          </div>

          {mode === 'login' && (
            <div className="text-left">
              <button type="button" onClick={() => setForgotOpen(true)} className="text-sm text-primary hover:underline">
                שכחת סיסמה?
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-elegant text-base"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : mode === 'login' ? (
              'התחבר'
            ) : (
              'הרשם'
            )}
          </Button>
        </form>

        {/* Apple Login */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">או</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('Apple')}
            className="w-full h-12 bg-foreground hover:bg-foreground/90 rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5 text-background" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-background font-medium">המשך עם Apple</span>
          </button>
        </div>

        <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={formData.email} />

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6 mb-8">
          בהתחברות אתה מסכים ל
          <button onClick={() => sonnerToast('בקרוב! אנחנו עובדים על זה 🚧')} className="text-primary hover:underline mx-1">תנאי השימוש</button>
          ול
          <button onClick={() => sonnerToast('בקרוב! אנחנו עובדים על זה 🚧')} className="text-primary hover:underline mx-1">מדיניות הפרטיות</button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
