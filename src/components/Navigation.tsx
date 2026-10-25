import { Link, useLocation } from 'react-router-dom';
import { Home, Search, GraduationCap, Brain, School } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'בית', icon: Home },
    { path: '/translator', label: 'תרגומון', icon: Search },
    { path: '/flashcards', label: 'כרטיסיות', icon: GraduationCap },
    { path: '/quiz', label: 'מבחנים', icon: Brain },
    { path: '/classes', label: 'ביה"ס שלי', icon: School },
  ];

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-50 px-3 pointer-events-none">
      <div className="glass glass-pill glass-strong mx-auto max-w-md pointer-events-auto">
        <div className="flex justify-around items-center py-2 px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                aria-current={isActive ? 'page' : undefined}
                className="glass-press relative flex flex-col items-center justify-center gap-1 px-2 py-1.5 min-w-0 flex-1"
              >
                {/* Circular highlight behind the active icon */}
                <span
                  className={`absolute top-0 flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-11 h-11 bg-primary/15 shadow-[0_4px_14px_-4px_rgba(15,118,110,0.45)] ring-1 ring-primary/25'
                      : 'w-11 h-11 bg-transparent'
                  }`}
                />
                <Icon
                  className={`relative w-[18px] h-[18px] transition-colors duration-300 ${
                    isActive
                      ? 'text-primary stroke-[2.5]'
                      : 'text-muted-foreground stroke-[2] hover:text-primary'
                  }`}
                />
                <span
                  className={`relative text-[11px] leading-tight transition-colors duration-300 ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground font-medium'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
