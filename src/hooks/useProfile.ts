import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  created_at: string;
  updated_at: string;
}

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

  const addPoints = async (pointsToAdd: number) => {
    if (!user || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.last_xp_date !== today;
    
    const newDailyXp = isNewDay ? pointsToAdd : profile.daily_xp + pointsToAdd;
    const newPoints = profile.points + pointsToAdd;

    await updateProfile({
      points: newPoints,
      daily_xp: newDailyXp,
      last_xp_date: today,
    });
  };

  const updateQuizStreak = async () => {
    if (!user || !profile) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastQuizDate = profile.last_quiz_date 
      ? new Date(profile.last_quiz_date).toISOString().split('T')[0]
      : null;

    let newStreak = profile.streak;

    if (!lastQuizDate) {
      // First quiz ever
      newStreak = 1;
    } else {
      const lastDate = new Date(lastQuizDate);
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already did a quiz today, keep streak
      } else if (diffDays === 1) {
        // Yesterday, increment streak
        newStreak = profile.streak + 1;
      } else if (diffDays >= 2) {
        // Missed a day, reset streak
        newStreak = 1;
      }
    }

    await updateProfile({
      streak: newStreak,
      last_quiz_date: now.toISOString(),
    });
  };

  const incrementWordsMastered = async () => {
    if (!user || !profile) return;

    await updateProfile({
      words_mastered: profile.words_mastered + 1,
    });
  };

  // Award coins + XP after a test/assignment based on the score (0-100).
  // Applies active multipliers and decrements them by 1.
  const awardScoreRewards = async (score: number) => {
    if (!user || !profile || score <= 0) return { coinsEarned: 0, xpEarned: 0 };

    const xpMul = profile.xp_multiplier_remaining > 0 ? 2 : 1;
    const coinMul = profile.coin_multiplier_remaining > 0 ? 2 : 1;
    const xpEarned = score * xpMul;
    const coinsEarned = score * coinMul;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.last_xp_date !== today;
    const newDailyXp = isNewDay ? xpEarned : profile.daily_xp + xpEarned;

    await updateProfile({
      points: profile.points + xpEarned,
      coins: profile.coins + coinsEarned,
      daily_xp: newDailyXp,
      last_xp_date: today,
      xp_multiplier_remaining: Math.max(0, profile.xp_multiplier_remaining - 1),
      coin_multiplier_remaining: Math.max(0, profile.coin_multiplier_remaining - 1),
    });

    return { coinsEarned, xpEarned };
  };

  const purchaseItem = async (item: ShopItem) => {
    if (!user || !profile) return { error: new Error('No user') };
    const price = SHOP_PRICES[item];
    if (profile.coins < price) return { error: new Error('not_enough_coins') };

    const updates: Partial<Profile> = { coins: profile.coins - price };
    if (item === 'xp_multiplier') updates.xp_multiplier_remaining = profile.xp_multiplier_remaining + 3;
    if (item === 'coin_multiplier') updates.coin_multiplier_remaining = profile.coin_multiplier_remaining + 3;
    if (item === 'power_up_5050') updates.power_up_5050 = profile.power_up_5050 + 1;

    return await updateProfile(updates);
  };

  const usePowerUp5050 = async () => {
    if (!user || !profile || profile.power_up_5050 <= 0) return { error: new Error('none') };
    return await updateProfile({ power_up_5050: profile.power_up_5050 - 1 });
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
  };
};
