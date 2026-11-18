import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { sfxCoin } from '@/lib/audio';

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

interface Props { open: boolean; streak: number; previous: number; }

/** Duolingo-style flame + day counter shown after finishing a regular Aramaic word quiz. */
const StreakCelebration = ({ open, streak, previous }: Props) => {
  const [shown, setShown] = useState(previous);

  useEffect(() => {
    if (!open) return;
    setShown(previous);
    const t = setTimeout(() => {
      setShown(streak);
      if (streak > previous) { haptic([20, 40, 30]); sfxCoin(); }
    }, 900);
    return () => clearTimeout(t);
  }, [open, streak, previous]);

  // Israel weekday (0 = Sunday)
  const todayIdx = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' })).getDay();
  const lit = (i: number) => {
    const back = (todayIdx - i + 7) % 7; // days before today
    return i <= todayIdx && back < streak;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] glass-backdrop flex items-center justify-center p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass rounded-[2rem] w-full max-w-sm p-8 flex flex-col items-center text-center"
            initial={{ y: 40, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="relative w-40 h-40 flex items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full bg-orange-500/30 blur-2xl"
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <motion.span
                className="relative text-[7rem] leading-none select-none"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.3, 1], rotate: [-20, 8, 0] }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                🔥
              </motion.span>
            </div>

            <div className="h-20 overflow-hidden relative w-full">
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={shown}
                  className="text-6xl font-black text-orange-500"
                  initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {shown}
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="text-xl font-bold text-foreground">{streak === 1 ? 'יום ראשון ברצף!' : 'ימי רצף!'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {streak > previous ? 'הרצף שלך גדל — תחזור מחר כדי לשמור עליו!' : 'כבר שמרת על הרצף היום 💪'}
            </p>

            <div className="flex gap-1.5 mt-6 mb-7" dir="rtl">
              {DAYS.map((d, i) => (
                <motion.div
                  key={d}
                  className={`w-9 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-semibold glass ${
                    lit(i) ? 'text-orange-500' : 'text-muted-foreground'
                  } ${i === todayIdx ? 'animate-glass-pulse' : ''}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  <span>{d}</span>
                  <span className="text-base leading-none">{lit(i) ? '🔥' : '·'}</span>
                </motion.div>
              ))}
            </div>

            <div className="w-full space-y-3">
              <Link to="/" className="block">
                <Button className="w-full h-12 rounded-full glass-teal glass-press">
                  <Home className="w-5 h-5 ml-2" /> לדף הבית
                </Button>
              </Link>
              <Link to="/quiz" className="block">
                <Button variant="outline" className="w-full h-12 rounded-full glass glass-press">
                  <RotateCcw className="w-5 h-5 ml-2" /> מבחן חדש
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;
