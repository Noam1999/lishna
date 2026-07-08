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
import LegalDialog, { type LegalDoc } from '@/components/LegalDialog';
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
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  
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
              <span className="text-sm text-muted-foreground cursor-not-allowed opacity-60">
                שכחת סיסמה?
              </span>
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

        {/* Google Login */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">או</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled
            className="w-full h-12 bg-card border border-border rounded-xl flex items-center justify-center gap-2 transition-colors shadow-soft opacity-60 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.39 3.58v2.98h3.86c2.26-2.09 3.58-5.17 3.58-8.8z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.86-2.98c-1.07.72-2.44 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.94.47 3.77 1.29 5.38l3.98-3.09z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
            </svg>
            <span className="text-foreground font-medium">התחברות באמצעות גוגל</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
              בקרוב
            </span>
          </button>
        </div>

        <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={formData.email} />

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6 mb-8">
          בהתחברות/הרשמה אתה מסכים ל
          <button type="button" onClick={() => setLegalDoc('terms')} className="text-primary hover:underline mx-1">תנאי השימוש</button>
          ול
          <button type="button" onClick={() => setLegalDoc('privacy')} className="text-primary hover:underline mx-1">מדיניות הפרטיות</button>
        </p>
        <LegalDialog
          open={legalDoc !== null}
          onOpenChange={(v) => { if (!v) setLegalDoc(null); }}
          doc={legalDoc ?? 'terms'}
        />
      </div>
    </div>
  );
};

export default Auth;
