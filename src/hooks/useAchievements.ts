import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
}

// Define all available achievements
const ACHIEVEMENT_DEFINITIONS = [
  {
    type: 'aramaic_scholar',
    name: 'למדן ארמי',
    description: 'שלוט ב-50 מילים',
    icon: '📚',
    requirement: 50,
    checkField: 'words_mastered'
  },
  {
    type: 'daily_streak_30',
    name: 'התמדה יומית',
    description: 'הגע לרצף של 30 ימים',
    icon: '🔥',
    requirement: 30,
    checkField: 'streak'
  },
  {
    type: 'word_beginner',
    name: 'מתחיל מוכשר',
    description: 'שלוט ב-10 מילים',
    icon: '🌱',
    requirement: 10,
    checkField: 'words_mastered'
  },
  {
    type: 'word_intermediate',
    name: 'לומד מתקדם',
    description: 'שלוט ב-25 מילים',
    icon: '📖',
    requirement: 25,
    checkField: 'words_mastered'
  },
  {
    type: 'points_100',
    name: 'צובר נקודות',
    description: 'צבור 100 נקודות',
    icon: '⭐',
    requirement: 100,
    checkField: 'points'
  },
  {
    type: 'points_500',
    name: 'אלוף הנקודות',
    description: 'צבור 500 נקודות',
    icon: '🏆',
    requirement: 500,
    checkField: 'points'
  },
  {
    type: 'streak_7',
    name: 'שבוע של הצלחה',
    description: 'הגע לרצף של 7 ימים',
    icon: '📅',
    requirement: 7,
    checkField: 'streak'
  },
  {
    type: 'first_quiz',
    name: 'מבחן ראשון',
    description: 'סיים את המבחן הראשון שלך',
    icon: '✅',
    requirement: 1,
    checkField: 'quizzes_completed'
  }
];

export const useAchievements = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchAchievements();
    }
  }, [user, profile]);

  const fetchAchievements = async () => {
    if (!user) return;
    
    setLoading(true);

    // Fetch user's unlocked achievements
    const { data: unlockedData, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching achievements:', error);
      setLoading(false);
      return;
    }

    const unlockedMap = new Map(
      unlockedData?.map(a => [a.achievement_type, a.unlocked_at]) || []
    );

    // Build achievements list with unlock status
    const achievementsList: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
      id: def.type,
      type: def.type,
      name: def.name,
      description: def.description,
      icon: def.icon,
      requirement: def.requirement,
      unlocked: unlockedMap.has(def.type),
      unlockedAt: unlockedMap.get(def.type)
    }));

    setAchievements(achievementsList);
    setLoading(false);
  };

  const checkAndUnlockAchievements = async () => {
    if (!user || !profile) return;

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      let currentValue = 0;
      
      switch (def.checkField) {
        case 'words_mastered':
          currentValue = profile.words_mastered || 0;
          break;
        case 'streak':
          currentValue = profile.streak || 0;
          break;
        case 'points':
          currentValue = profile.points || 0;
          break;
        case 'quizzes_completed':
          // Check if user has completed at least one quiz
          currentValue = profile.last_quiz_date ? 1 : 0;
          break;
      }

      if (currentValue >= def.requirement) {
        // Try to unlock (insert will fail silently if already exists due to unique constraint)
        await supabase
          .from('achievements')
          .upsert({
            user_id: user.id,
            achievement_type: def.type
          }, {
            onConflict: 'user_id,achievement_type',
            ignoreDuplicates: true
          });
      }
    }

    // Refresh achievements
    fetchAchievements();
  };

  return {
    achievements,
    loading,
    checkAndUnlockAchievements,
    refetch: fetchAchievements
  };
};
