import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAvatar } from '@/contexts/AvatarContext';
import { SKINS, RARITY_LABEL, getSkin, Skin } from '@/lib/skins';
import UserAvatar from '@/components/UserAvatar';

const RARITY_BADGE: Record<Skin['rarity'], string> = {
  free: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  common: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  rare: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
  epic: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40',
  mythic: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40',
  legendary: 'bg-yellow-500/20 text-amber-700 dark:text-amber-200 border-yellow-500/50',
  cosmic: 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 text-foreground border-pink-400/50',
};

const Wardrobe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, buySkin } = useProfile();
  const { owned, equipped, ownsSkin, equipSkin } = useAvatar();
  const [busy, setBusy] = useState<string | null>(null);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const equippedSkin = getSkin(equipped);

  const handleBuy = async (skin: Skin) => {
    if (!profile || busy) return;
    if (ownsSkin(skin.id)) return;
    if (profile.coins < skin.coins) { toast.error('אין מספיק מטבעות'); return; }
    if (profile.diamonds < skin.diamonds) { toast.error('אין מספיק יהלומים'); return; }
    setBusy(skin.id);
    const { error } = await buySkin(skin.id);
    setBusy(null);
    if (error) { toast.error('הרכישה נכשלה'); return; }
    toast.success(`🎉 רכשת: ${skin.name}`);
  };

  const handleEquip = async (skin: Skin) => {
    await equipSkin(skin.id);
    toast.success(`לבשת: ${skin.name}`);
  };

  const ownedSkins = SKINS.filter((s) => owned.includes(s.id));

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24" dir="rtl">
        {/* Header */}
        <div className="relative bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted"
            aria-label="חזור"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center pt-4">
            <motion.div
              key={equipped}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <UserAvatar size={120} />
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-foreground mt-3">המלתחה שלך</h1>
            <p className="text-sm text-muted-foreground">לבוש כעת: <span className="font-semibold text-foreground">{equippedSkin.name}</span></p>

            {/* Balance */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1.5 text-sm font-bold shadow-soft">
                💰 <span>{profile?.coins ?? 0}</span>
              </span>
              <span className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1.5 text-sm font-bold shadow-soft">
                💎 <span>{profile?.diamonds ?? 0}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="px-4">
          <Tabs defaultValue="shop" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="shop">🛍️ חנות תלבושות</TabsTrigger>
              <TabsTrigger value="inventory">🎒 הטיק שלי ({ownedSkins.length})</TabsTrigger>
            </TabsList>

            {/* SHOP */}
            <TabsContent value="shop" className="space-y-3">
              {SKINS.filter((s) => s.id !== 'default').map((skin, i) => {
                const isOwned = ownsSkin(skin.id);
                const canAfford = (profile?.coins ?? 0) >= skin.coins && (profile?.diamonds ?? 0) >= skin.diamonds;
                return (
                  <motion.div
                    key={skin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-center gap-4"
                  >
                    <UserAvatar skinId={skin.id} size={64} />
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', RARITY_BADGE[skin.rarity])}>
                          {skin.tierLabel} · {RARITY_LABEL[skin.rarity]}
                        </span>
                        <h3 className="font-bold text-foreground">{skin.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-2 justify-end text-sm font-bold text-foreground">
                        <span className="flex items-center gap-1">💰 {skin.coins}</span>
                        {skin.diamonds > 0 && <span className="flex items-center gap-1">💎 {skin.diamonds}</span>}
                      </div>
                    </div>
                    {isOwned ? (
                      <Button size="sm" variant="secondary" disabled className="gap-1">
                        <Check className="w-4 h-4" /> נרכש
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canAfford || busy === skin.id}
                        onClick={() => handleBuy(skin)}
                      >
                        {busy === skin.id ? '...' : canAfford ? 'קנייה' : (
                          <><Lock className="w-3.5 h-3.5 ml-1" />חסר</>
                        )}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* INVENTORY */}
            <TabsContent value="inventory">
              <div className="grid grid-cols-2 gap-3">
                {ownedSkins.map((skin, i) => {
                  const isEquipped = equipped === skin.id;
                  return (
                    <motion.div
                      key={skin.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'rounded-2xl p-4 border-2 flex flex-col items-center text-center shadow-soft transition-all',
                        isEquipped
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border bg-card',
                      )}
                    >
                      {isEquipped && (
                        <span className="absolute -mt-7 ml-16 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> לבוש
                        </span>
                      )}
                      <UserAvatar skinId={skin.id} size={72} />
                      <p className="font-bold text-sm mt-2 text-foreground">{skin.name}</p>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1', RARITY_BADGE[skin.rarity])}>
                        {skin.tierLabel}
                      </span>
                      <Button
                        size="sm"
                        variant={isEquipped ? 'secondary' : 'default'}
                        disabled={isEquipped}
                        onClick={() => handleEquip(skin)}
                        className="mt-3 w-full"
                      >
                        {isEquipped ? 'מצויד' : 'הלבש'}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
              {ownedSkins.length <= 1 && (
                <p className="text-center text-muted-foreground text-sm mt-6">
                  עדיין אין לך פריטים. עבור לחנות כדי לרכוש את התלבושת הראשונה שלך! 🛍️
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default Wardrobe;
