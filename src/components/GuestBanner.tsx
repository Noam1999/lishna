import { Link } from 'react-router-dom';
import { AlertTriangle, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const GuestBanner = () => {
  const { user, loading } = useAuth();

  if (loading || user) return null;

  return (
    <div className="sticky top-0 z-40 bg-destructive/15 border-b border-destructive/30 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <p className="text-xs font-medium text-foreground flex-1 leading-relaxed">
          ⚠️ שים לב: ההתקדמות שלך לא נשמרת! התחבר עכשיו כדי לשמור על הלהבה והניקוד שלך.
        </p>
        <Link
          to="/auth"
          className="shrink-0 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <LogIn className="w-3.5 h-3.5" />
          התחבר
        </Link>
      </div>
    </div>
  );
};

export default GuestBanner;
