import { ScrollText } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <header className="text-center pt-8 pb-6 px-4">
      {user && profile && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1 text-xs font-bold shadow-soft">
            <span>💰</span>
            <span className="text-foreground">{profile.coins}</span>
          </span>
          <span className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1 text-xs font-bold shadow-soft">
            <span>💎</span>
            <span className="text-foreground">{profile.diamonds}</span>
          </span>
        </div>
      )}
      <div className="flex items-center justify-center gap-3 mb-2">
        <ScrollText className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      )}
    </header>
  );
};

export default Header;
