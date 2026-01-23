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
  created_at: string;
  updated_at: string;
}

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

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    addPoints,
    updateQuizStreak,
    incrementWordsMastered,
  };
};
