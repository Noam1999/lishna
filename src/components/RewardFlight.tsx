import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sfxCoin } from '@/lib/audio';

type FlightItem = { id: number; icon: string; targetId: string; x: number; y: number };

let counter = 0;

export const emitReward = (kind: 'coins' | 'diamonds' | 'xp', amount = 1) => {
  if (amount <= 0) return;
  window.dispatchEvent(new CustomEvent('lishna:reward', { detail: { kind, amount } }));
};

const ICONS: Record<string, string> = { coins: '💰', diamonds: '💎', xp: '✨' };
const TARGETS: Record<string, string> = {
  coins: 'lishna-balance-coins',
  diamonds: 'lishna-balance-diamonds',
  xp: 'lishna-balance-coins',
};

const RewardFlight = () => {
  const [items, setItems] = useState<FlightItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { kind, amount } = (e as CustomEvent).detail as { kind: keyof typeof ICONS; amount: number };
      const targetId = TARGETS[kind];
      const el = document.getElementById(targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const targetX = r.left + r.width / 2;
      const targetY = r.top + r.height / 2;
      const count = Math.min(8, Math.max(3, Math.round(Math.log2(amount + 1))));
      const newItems: FlightItem[] = Array.from({ length: count }).map((_, i) => ({
        id: ++counter,
        icon: ICONS[kind],
        targetId,
        x: targetX - window.innerWidth / 2 + (Math.random() - 0.5) * 40,
        y: targetY - window.innerHeight / 2 + (Math.random() - 0.5) * 40,
      }));
      setItems((prev) => [...prev, ...newItems]);
      sfxCoin();
      const ids = newItems.map((n) => n.id);
      setTimeout(() => setItems((prev) => prev.filter((p) => !ids.includes(p.id))), 1300);
    };
    window.addEventListener('lishna:reward', handler);
    return () => window.removeEventListener('lishna:reward', handler);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      <AnimatePresence>
        {items.map((it, idx) => (
          <motion.div
            key={it.id}
            initial={{ x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, scale: 0.2, opacity: 0 }}
            animate={{ x: it.x, y: it.y, scale: [0.4, 1.4, 0.6], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, ease: 'easeInOut', delay: idx * 0.05 }}
            className="absolute text-3xl"
          >
            {it.icon}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RewardFlight;
