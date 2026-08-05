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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elegant z-50">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-all duration-300 min-w-0 ${
                isActive 
                  ? 'text-primary bg-primary/10 scale-105' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
