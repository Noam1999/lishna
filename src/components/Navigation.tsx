import { Link, useLocation } from 'react-router-dom';
import { Book, GraduationCap, Brain, Home, Trophy } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'בית', icon: Home },
    { path: '/translator', label: 'תרגומון', icon: Book },
    { path: '/flashcards', label: 'כרטיסיות', icon: GraduationCap },
    { path: '/quiz', label: 'מבחן', icon: Brain },
    { path: '/leaderboard', label: 'ליגה', icon: Trophy },
  ];

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elegant z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-lg mx-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-primary bg-primary/10 scale-105' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
