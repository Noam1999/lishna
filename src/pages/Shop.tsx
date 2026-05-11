import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { useProfile, SHOP_PRICES, ShopItem } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import LuckyWheel from '@/components/LuckyWheel';
import ExchangeHub from '@/components/ExchangeHub';

interface ShopCard {
  id: ShopItem;
  emoji: string;
  title: string;
  description: string;
  price: number;
  accent: string;
}

const SHOP_ITEMS: ShopCard[] = [
  {
    id: 'xp_multiplier',
    emoji: '✨',
    title: 'מכפיל XP',
    description: 'הכפל את ה-XP שתרוויח ב-3 המבחנים הבאים',
    price: SHOP_PRICES.xp_multiplier,
    accent: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  },
  {
    id: 'coin_multiplier',
    emoji: '💰',
    title: 'מכפיל מטבעות',
    description: 'הכפל את המטבעות שתרוויח ב-3 המבחנים הבאים',
    price: SHOP_PRICES.coin_multiplier,
    accent: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
  },
  {
    id: 'power_up_5050',
    emoji: '⚡',
    title: 'כוח 50:50',
    description: 'במהלך מבחן, הסר 2 תשובות שגויות',
    price: SHOP_PRICES.power_up_5050,
    accent: 'from-sky-500/20 to-cyan-500/20 border-sky-500/30',
  },
];

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, purchaseItem } = useProfile();
  const [purchasing, setPurchasing] = useState<ShopItem | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleBuy = async (item: ShopItem) => {
    if (!profile || purchasing) return;
    if (profile.coins < SHOP_PRICES[item]) {
      toast.error('אין מספיק מטבעות');
      return;
    }
    setPurchasing(item);
    const { error } = await purchaseItem(item);
    setPurchasing(null);
    if (error) {
      toast.error('הרכישה נכשלה');
      return;
    }
    setCelebrate(true);
    toast.success('רכישה הושלמה! 🎉');
    setTimeout(() => setCelebrate(false), 1200);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24" dir="rtl">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted"
            aria-label="חזור"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="text-center pt-4">
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">
              החנות של לישנא
            </h1>
            <p className="text-sm text-muted-foreground">השתמש במטבעות שצברת</p>

            {/* Balance */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-soft"
              >
                <span className="text-lg">💰</span>
                <span className="font-bold text-foreground">{profile?.coins ?? 0}</span>
              </motion.div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-soft"
              >
                <span className="text-lg">✨</span>
                <span className="font-bold text-foreground">{profile?.points ?? 0}</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Active boosts */}
        {profile && (profile.xp_multiplier_remaining > 0 || profile.coin_multiplier_remaining > 0 || profile.power_up_5050 > 0) && (
          <div className="px-6 mb-4 flex flex-wrap gap-2 justify-center">
            {profile.xp_multiplier_remaining > 0 && (
              <span className="text-xs bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-full px-3 py-1 font-medium">
                ✨ מכפיל XP פעיל · {profile.xp_multiplier_remaining} מבחנים
              </span>
            )}
            {profile.coin_multiplier_remaining > 0 && (
              <span className="text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 rounded-full px-3 py-1 font-medium">
                💰 מכפיל מטבעות פעיל · {profile.coin_multiplier_remaining} מבחנים
              </span>
            )}
            {profile.power_up_5050 > 0 && (
              <span className="text-xs bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 rounded-full px-3 py-1 font-medium">
                ⚡ כוח 50:50 · {profile.power_up_5050} זמינים
              </span>
            )}
          </div>
        )}

        {/* Items */}
        <div className="px-6 space-y-4">
          {SHOP_ITEMS.map((item, i) => {
            const canAfford = (profile?.coins ?? 0) >= item.price;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-br ${item.accent} border rounded-2xl p-5 shadow-soft`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center text-3xl shadow-soft flex-shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="font-bold text-lg text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                        <span>💰</span>
                        <span>{item.price}</span>
                      </div>
                      <Button
                        size="sm"
                        disabled={!canAfford || purchasing === item.id}
                        onClick={() => handleBuy(item.id)}
                      >
                        {purchasing === item.id ? '...' : canAfford ? 'רכישה' : 'אין מספיק'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Purchase celebration overlay */}
        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.2, 1], rotate: [-20, 0, 0] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-card border-2 border-primary rounded-3xl p-8 shadow-elegant flex flex-col items-center gap-3"
              >
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-12 h-12 text-primary" strokeWidth={3} />
                </div>
                <p className="text-xl font-bold text-foreground">רכישה הושלמה!</p>
              </motion.div>
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{
                    background: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'][i % 6],
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    opacity: [1, 1, 0],
                    scale: [0, 1.2, 0],
                  }}
                  transition={{ duration: 1, delay: i * 0.02 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Shop;
