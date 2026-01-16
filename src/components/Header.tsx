import { ScrollText } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <header className="text-center pt-8 pb-6 px-4">
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
