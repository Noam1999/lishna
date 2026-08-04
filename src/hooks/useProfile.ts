import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { emitReward } from '@/components/RewardFlight';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  words_mastered: number;
  streak: number;
  last_quiz_date: string | null;
  daily_xp: number;
  last_xp_date: string | null;
  coins: number;
  xp_multiplier_remaining: number;
  coin_multiplier_remaining: number;
  power_up_5050: number;
  diamonds: number;
  last_wheel_spin_at: string | null;
  owned_skins: string[];
  equipped_skin: string;
  wheel_spins: number;
  created_at: string;
  updated_at: string;
}

export const COINS_PER_DIAMOND = 100;
export const WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type WheelPrize =
  | { kind: 'coins'; amount: number; label: string }
  | { kind: 'diamonds'; amount: number; label: string }
  | { kind: 'none'; label: string };

// Order matches visible wheel slices
export const WHEEL_SEGMENTS: { prize: WheelPrize; weight: number; color: string }[] = [
  { prize: { kind: 'coins', amount: 1, label: '1 מטבע' }, weight: 31, color: '#fbbf24' },
  { prize: { kind: 'none', label: 'אין פרס' }, weight: 9, color: '#6b7280' },
  { prize: { kind: 'coins', amount: 50, label: '50 מטבעות' }, weight: 15, color: '#f59e0b' },
  { prize: { kind: 'diamonds', amount: 5, label: '5 יהלומים' }, weight: 5, color: '#22d3ee' },
  { prize: { kind: 'coins', amount: 1000, label: '1000 מטבעות' }, weight: 0.09, color: '#ef4444' },
  { prize: { kind: 'none', label: 'אין פרס' }, weight: 9, color: '#6b7280' },
  { prize: { kind: 'diamonds', amount: 1, label: '1 יהלום' }, weight: 20.91, color: '#06b6d4' },
  { prize: { kind: 'coins', amount: 100, label: '100 מטבעות' }, weight: 10, color: '#10b981' },
];

export type ShopItem = 'xp_multiplier' | 'coin_multiplier' | 'power_up_5050';
export const SHOP_PRICES: Record<ShopItem, number> = {
  xp_multiplier: 500,
  coin_multiplier: 500,
  power_up_5050: 200,
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  // Only non-economic, user-owned fields may be written directly.
  // Every currency / progression change goes through a validated server function.
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return { error: new Error('No user or profile') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  // Applies server-side reward results locally (animations + fresh data).
  const afterEconomy = async (gained?: { coins?: number; diamonds?: number }) => {
    if (gained?.coins) emitReward('coins', gained.coins);
    if (gained?.diamonds) emitReward('diamonds', gained.diamonds);
    await fetchProfile();
  };

  const addPoints = async (pointsToAdd: number) => {
    if (!user) return;
    await supabase.rpc('add_points', { _pts: pointsToAdd });
    await fetchProfile();
  };

  const updateQuizStreak = async () => {
    if (!user) return;
    await supabase.rpc('update_quiz_streak');
    await fetchProfile();
  };

  const incrementWordsMastered = async () => {
    if (!user) return;
    await supabase.rpc('sync_words_mastered');
    await fetchProfile();
  };

  // Award coins + XP after a test/assignment based on the score (0-100).
  // Multipliers and amounts are computed and validated on the server.
  const awardScoreRewards = async (score: number) => {
    if (!user) return { coinsEarned: 0, xpEarned: 0 };
    const { data } = await supabase.rpc('award_quiz_rewards', { _score: Math.round(score) });
    const res = (data as { coinsEarned?: number; xpEarned?: number } | null) || {};
    await afterEconomy({ coins: res.coinsEarned });
    return { coinsEarned: res.coinsEarned ?? 0, xpEarned: res.xpEarned ?? 0 };
  };

  const purchaseItem = async (item: ShopItem) => {
    if (!user) return { error: new Error('No user') };
    const { data, error } = await supabase.rpc('purchase_shop_item', { _item: item });
    const res = data as { error?: string } | null;
    await fetchProfile();
    if (error) return { error: error as unknown as Error };
    if (res?.error) return { error: new Error(res.error) };
    return { error: null };
  };

  const usePowerUp5050 = async () => {
    if (!user) return { error: new Error('none') };
    const { data, error } = await supabase.rpc('use_power_up_5050');
    const res = data as { error?: string } | null;
    await fetchProfile();
    if (error) return { error: error as unknown as Error };
    if (res?.error) return { error: new Error(res.error) };
    return { error: null };
  };

  // Convert coins -> diamonds (100 coins = 1 diamond)
  const exchangeCoinsToDiamonds = async (diamondAmount: number) => {
    const { data, error } = await supabase.rpc('exchange_currency', {
      _direction: 'coins_to_diamonds',
      _amount: diamondAmount,
    });
    const res = data as { error?: string } | null;
    await afterEconomy({ diamonds: res?.error ? 0 : diamondAmount });
    if (error) return { error: error as unknown as Error };
    if (res?.error) return { error: new Error(res.error) };
    return { error: null };
  };

  // Convert diamonds -> coins (1 diamond = 100 coins)
  const exchangeDiamondsToCoins = async (diamondAmount: number) => {
    const { data, error } = await supabase.rpc('exchange_currency', {
      _direction: 'diamonds_to_coins',
      _amount: diamondAmount,
    });
    const res = data as { error?: string } | null;
    await afterEconomy({ coins: res?.error ? 0 : diamondAmount * COINS_PER_DIAMOND });
    if (error) return { error: error as unknown as Error };
    if (res?.error) return { error: new Error(res.error) };
    return { error: null };
  };

  const spinWheel = async (): Promise<{ segmentIndex: number; prize: WheelPrize } | { error: Error }> => {
    if (!user) return { error: new Error('no_profile') };
    const { data, error } = await supabase.rpc('spin_wheel');
    if (error) return { error: error as unknown as Error };
    const res = data as { error?: string; segmentIndex?: number; kind?: string; amount?: number } | null;
    if (!res || res.error) return { error: new Error(res?.error || 'failed') };
    const segmentIndex = res.segmentIndex ?? 0;
    const prize = WHEEL_SEGMENTS[segmentIndex]?.prize ?? { kind: 'none', label: 'אין פרס' };
    await afterEconomy({
      coins: res.kind === 'coins' ? res.amount : 0,
      diamonds: res.kind === 'diamonds' ? res.amount : 0,
    });
    return { segmentIndex, prize };
  };

  const buySkin = async (skinId: string) => {
    const { data, error } = await supabase.rpc('buy_skin', { _skin_id: skinId });
    const res = data as { error?: string } | null;
    await fetchProfile();
    if (error) return { error: error as unknown as Error };
    if (res?.error) return { error: new Error(res.error) };
    return { error: null };
  };

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    addPoints,
    updateQuizStreak,
    incrementWordsMastered,
    awardScoreRewards,
    purchaseItem,
    usePowerUp5050,
    exchangeCoinsToDiamonds,
    exchangeDiamondsToCoins,
    spinWheel,
    buySkin,
  };
};
