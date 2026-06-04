import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

export interface DailyQuest {
  id: string;
  quest_type: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  bonus_xp: number;
  claimed: boolean;
}

const QUEST_DEFINITIONS = [
  { type: 'learn_words', label: 'למד מילים חדשות', icon: '📖', target: 5, xp: 30 },
  { type: 'learn_words_10', label: 'למד 10 מילים חדשות', icon: '📚', target: 10, xp: 60 },
  { type: 'complete_quizzes', label: 'השלם מבחנים', icon: '🧠', target: 2, xp: 40 },
  { type: 'complete_quiz_1', label: 'השלם מבחן אחד', icon: '✍️', target: 1, xp: 20 },
  { type: 'earn_points', label: 'צבור נקודות היום', icon: '⭐', target: 150, xp: 50 },
  { type: 'earn_points_100', label: 'צבור 100 נקודות', icon: '💫', target: 100, xp: 35 },
];

export const getQuestLabel = (questType: string): { label: string; icon: string } => {
  const def = QUEST_DEFINITIONS.find(d => d.type === questType);
  return def ? { label: def.label, icon: def.icon } : { label: questType, icon: '🎯' };
};

export const useDailyQuests = () => {
  const { user } = useAuth();
  const { profile, addPoints, updateProfile } = useProfile();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [lastRewardLabel, setLastRewardLabel] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const generateDailyQuests = useCallback(async () => {
    if (!user) return;

    // Pick 3 random quests using date as seed for consistency
    const seed = today.split('-').join('');
    const shuffled = [...QUEST_DEFINITIONS].sort((a, b) => {
      const hashA = (parseInt(seed) * a.type.length) % 100;
      const hashB = (parseInt(seed) * b.type.length) % 100;
      return hashA - hashB;
    });
    const selected = shuffled.slice(0, 3);

    for (const quest of selected) {
      await supabase
        .from('daily_quests')
        .upsert(
          {
            user_id: user.id,
            quest_date: today,
            quest_type: quest.type,
            target_value: quest.target,
            bonus_xp: quest.xp,
          },
          { onConflict: 'user_id,quest_date,quest_type' }
        );
    }
  }, [user, today]);

  const fetchQuests = useCallback(async () => {
    if (!user) {
      setQuests([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('quest_date', today);

    if (error) {
      console.error('Error fetching quests:', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // Generate quests for today
      await generateDailyQuests();
      // Re-fetch
      const { data: newData } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('quest_date', today);
      setQuests(newData || []);
    } else {
      setQuests(data);
    }
    setLoading(false);
  }, [user, today, generateDailyQuests]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const updateQuestProgress = async (questType: string, increment: number) => {
    if (!user) return;

    // Find all matching quests for the given type category
    const category = questType.split('_').slice(0, 2).join('_'); // e.g. "learn_words", "complete_quizzes", "earn_points"
    const matchingQuests = quests.filter(q => 
      q.quest_type.startsWith(category) && !q.completed
    );

    for (const quest of matchingQuests) {
      const newValue = Math.min(quest.current_value + increment, quest.target_value);
      const nowCompleted = newValue >= quest.target_value;

      await supabase
        .from('daily_quests')
        .update({
          current_value: newValue,
          completed: nowCompleted,
        })
        .eq('id', quest.id);

      setQuests(prev =>
        prev.map(q =>
          q.id === quest.id
            ? { ...q, current_value: newValue, completed: nowCompleted }
            : q
        )
      );
    }
  };

  const claimReward = async (questId: string) => {
    if (!user || !profile) return;

    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    await supabase
      .from('daily_quests')
      .update({ claimed: true })
      .eq('id', questId);

    // XP reward (always)
    await addPoints(quest.bonus_xp);

    // Bonus rewards — coins / diamonds / a wheel spin (deterministic per quest id)
    const seed = quest.id.charCodeAt(0) + quest.id.charCodeAt(quest.id.length - 1);
    const kind = seed % 3; // 0=coins, 1=diamonds, 2=wheel spin
    const updates: Record<string, number> = {};
    let label = `+${quest.bonus_xp} XP`;
    if (kind === 0) {
      const c = 30 + (seed % 70);
      updates.coins = profile.coins + c;
      label += ` · +${c} 💰`;
    } else if (kind === 1) {
      const d = 1 + (seed % 3);
      updates.diamonds = profile.diamonds + d;
      label += ` · +${d} 💎`;
    } else {
      updates.wheel_spins = (profile.wheel_spins || 0) + 1;
      label += ` · 🎡 סיבוב גלגל`;
    }
    if (Object.keys(updates).length) await updateProfile(updates);

    setJustClaimed(questId);
    setLastRewardLabel(label);
    setTimeout(() => setJustClaimed(null), 2200);

    setQuests(prev => prev.map(q => (q.id === questId ? { ...q, claimed: true } : q)));
  };

  return {
    quests,
    loading,
    justClaimed,
    lastRewardLabel,
    fetchQuests,
    updateQuestProgress,
    claimReward,
  };
};
