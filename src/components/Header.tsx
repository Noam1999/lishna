import { Inbox } from 'lucide-react';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadMail } from '@/hooks/useUnreadMail';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { count } = useUnreadMail();

  return (
    <header className="text-center pt-8 pb-6 px-4">
      {user && profile && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <span id="lishna-balance-coins" className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1 text-xs font-bold shadow-soft">
            <span>💰</span>
            <span className="text-foreground">{profile.coins}</span>
          </span>
          <span id="lishna-balance-diamonds" className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1 text-xs font-bold shadow-soft">
            <span>💎</span>
            <span className="text-foreground">{profile.diamonds}</span>
          </span>
          <Link to="/inbox" className="relative bg-card border border-border rounded-full p-1.5 shadow-soft" aria-label="תיבת דואר">
            <Inbox className="w-4 h-4 text-foreground" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      )}
      <div className="flex items-center justify-center gap-3 mb-2">
        <Logo className="w-9 h-9" />
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      )}
    </header>
  );
};

export default Header;
