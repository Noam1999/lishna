import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import PageTransition from '@/components/PageTransition';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  TIERS, XP_PER_TIER, PASS_TIERS, PASS_PLUS_PRICE, PASS_PRO_PRICE,
  tierFromXp, xpInTier, type Reward, type Track,
} from '@/lib/pass';
import { getSkin } from '@/lib/skins';
import { haptic } from '@/lib/haptics';

const trackMeta: Record<Track, { label: string; sub: string; ring: string; bg: string }> = {
  free: { label: 'חינם',  sub: 'לכולם',     ring: 'ring-slate-400/50',  bg: 'from-slate-700/40 to-slate-800/40' },
  plus: { label: 'פלוס',  sub: '25 💎',     ring: 'ring-sky-400/60',    bg: 'from-sky-500/20 to-blue-700/20' },
  pro:  { label: 'פרו',   sub: '50 💎',     ring: 'ring-amber-300/70',  bg: 'from-amber-500/25 to-orange-600/25' },
};

const RewardCell = ({
  reward, tier, track, unlocked, owned, claimed, onClaim,
}: {
  reward: Reward; tier: number; track: Track;
  unlocked: boolean; owned: boolean; claimed: boolean;
  onClaim: () => void;
}) => {
  const skin = reward.kind === 'skin' && reward.skinId ? getSkin(reward.skinId) : null;
  const canClaim = unlocked && owned && !claimed;
  const meta = trackMeta[track];

  return (
    <motion.button
      whileTap={canClaim ? { scale: 0.92 } : undefined}
      disabled={!canClaim}
      onClick={onClaim}
      className={[
        'relative w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 p-2',
        'bg-gradient-to-br', meta.bg, 'border border-border/40 ring-2', meta.ring,
        claimed ? 'opacity-50 grayscale' : '',
        canClaim ? 'shadow-elegant animate-pulse' : '',
        !owned ? 'opacity-60' : '',
      ].join(' ')}
    >
      {skin ? (
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${skin.bg} flex items-center justify-center text-xl shadow-md`}>
          {skin.emoji}
        </div>
      ) : (
        <div className="text-2xl">{reward.emoji}</div>
      )}
      <div className="text-[10px] text-center font-semibold text-foreground/90 leading-tight px-1">
        {reward.kind === 'skin' ? reward.label : reward.label}
      </div>

      {!owned && (
        <div className="absolute inset-0 rounded-2xl bg-background/55 backdrop-blur-[1px] flex items-center justify-center">
          <Lock className="w-5 h-5 text-foreground/80" />
        </div>
      )}
      {owned && !unlocked && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/70 flex items-center justify-center">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      {claimed && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-400" />
        </div>
      )}
    </motion.button>
  );
};

const Pass = () => {
  const { user } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const [busy, setBusy] = useState(false);

  const xp = profile?.points ?? 0;
  const currentTier = tierFromXp(xp);
  const progressInTier = xpInTier(xp);
  const passPlus = (profile as any)?.pass_plus ?? false;
  const passPro = (profile as any)?.pass_pro ?? false;
  const claimsFree: number[] = (profile as any)?.pass_claims_free ?? [];
  const claimsPlus: number[] = (profile as any)?.pass_claims_plus ?? [];
  const claimsPro:  number[] = (profile as any)?.pass_claims_pro  ?? [];

  const buyPass = async (kind: 'plus' | 'pro') => {
    if (!profile) return;
    const price = kind === 'plus' ? PASS_PLUS_PRICE : PASS_PRO_PRICE;
    if (profile.diamonds < price) { toast.error('אין מספיק יהלומים'); return; }
    if ((kind === 'plus' && passPlus) || (kind === 'pro' && passPro)) return;
    setBusy(true);
    const { data } = await supabase.rpc('buy_pass', { _kind: kind });
    await fetchProfile();
    setBusy(false);
    const res = data as { error?: string } | null;
    if (res?.error) { toast.error('הרכישה נכשלה'); return; }
    toast.success(kind === 'plus' ? 'Lishna Pass Plus הופעל! 💫' : 'Lishna Pass Pro הופעל! 👑');
  };

  const claim = async (track: Track, tier: number, reward: Reward) => {
    if (!profile) return;
    haptic(15);
    const claimsKey =
      track === 'free' ? 'pass_claims_free' :
      track === 'plus' ? 'pass_claims_plus' : 'pass_claims_pro';
    const current = (profile as any)[claimsKey] as number[] | undefined ?? [];
    if (current.includes(tier)) return;

    const { data } = await supabase.rpc('claim_pass_reward', {
      _track: track,
      _tier: tier,
      _kind: reward.kind,
      _amount: reward.amount ?? 0,
      _skin_id: reward.skinId ?? null,
    });
    await fetchProfile();
    const res = data as { error?: string } | null;
    if (res?.error) { toast.error('לא ניתן לקבל את הפרס'); return; }
    toast.success(`התקבל: ${reward.label} ✨`);
  };

  const isOwned = (t: Track) => t === 'free' || (t === 'plus' ? passPlus : passPro);
  const isClaimed = (t: Track, tier: number) =>
    (t === 'free' ? claimsFree : t === 'plus' ? claimsPlus : claimsPro).includes(tier);

  const totalTiersUnlocked = currentTier - 1 + (progressInTier === 0 && currentTier > 1 ? 0 : 0);

  if (!user) {
    return (
      <PageTransition>
        <Header title="Lishna Pass" />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <Sparkles className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">התחבר לצפייה ב-Lishna Pass</h2>
            <Button asChild><Link to="/auth">התחברות</Link></Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Header title="Lishna Pass" />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32">
        {/* Hero */}
        <div className="relative px-4 pt-4">
          <div className="rounded-3xl p-5 bg-gradient-to-br from-primary/20 via-purple-500/15 to-amber-400/15 border border-primary/30 shadow-elegant">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/" className="p-1 -mr-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
              <Crown className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-bold">Lishna Pass</h1>
              <span className="ml-auto text-xs text-muted-foreground">עונה 1</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">צבור XP, עלה דרגות, וקבל פרסים ייחודיים בכל שלב.</p>

            <div className="bg-background/50 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold">דרגה {currentTier} / {PASS_TIERS}</span>
                <span className="text-muted-foreground">{progressInTier}/{XP_PER_TIER} XP</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-purple-500 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progressInTier / XP_PER_TIER) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>

            {/* Upgrade buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                onClick={() => buyPass('plus')} disabled={busy || passPlus}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90"
              >
                {passPlus ? '✓ Plus פעיל' : `שדרג לפלוס · ${PASS_PLUS_PRICE} 💎`}
              </Button>
              <Button
                onClick={() => buyPass('pro')} disabled={busy || passPro}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
              >
                {passPro ? '✓ Pro פעיל' : `שדרג לפרו · ${PASS_PRO_PRICE} 💎`}
              </Button>
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 px-4 mt-6 mb-2 text-center text-xs font-bold">
          <div />
          <div className="py-1.5 rounded-lg bg-slate-700/30">חינם</div>
          <div className="py-1.5 rounded-lg bg-sky-500/20 ring-1 ring-sky-400/30">פלוס</div>
          <div className="py-1.5 rounded-lg bg-amber-500/20 ring-1 ring-amber-300/40">פרו</div>
        </div>

        {/* Vertical roadmap */}
        <div className="px-4 space-y-2">
          {TIERS.map((t, idx) => {
            const tier = idx + 1;
            const unlocked = currentTier > tier || (currentTier === tier && progressInTier === XP_PER_TIER) || currentTier > PASS_TIERS;
            const reachedOrCurrent = currentTier > tier;
            return (
              <div key={tier} className={`grid grid-cols-[40px_1fr_1fr_1fr] gap-2 items-center ${currentTier === tier ? 'scale-[1.02]' : ''}`}>
                <div className={[
                  'flex items-center justify-center h-10 rounded-xl font-bold text-sm',
                  reachedOrCurrent
                    ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-md'
                    : 'bg-muted text-muted-foreground',
                ].join(' ')}>
                  {tier}
                </div>
                <RewardCell
                  reward={t.free} tier={tier} track="free"
                  unlocked={reachedOrCurrent} owned={isOwned('free')}
                  claimed={isClaimed('free', tier)}
                  onClaim={() => claim('free', tier, t.free)}
                />
                <RewardCell
                  reward={t.plus} tier={tier} track="plus"
                  unlocked={reachedOrCurrent} owned={isOwned('plus')}
                  claimed={isClaimed('plus', tier)}
                  onClaim={() => claim('plus', tier, t.plus)}
                />
                <RewardCell
                  reward={t.pro} tier={tier} track="pro"
                  unlocked={reachedOrCurrent} owned={isOwned('pro')}
                  claimed={isClaimed('pro', tier)}
                  onClaim={() => claim('pro', tier, t.pro)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
};

export default Pass;
