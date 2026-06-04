import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useUserWords } from './useUserWords';

const STREAK_MILESTONES = [10, 25, 30, 40, 50, 75, 100];
const WORD_MILESTONES = [100, 250, 500, 1000];
const LEAGUE_THRESHOLDS = [0, 500, 1500, 3500, 7500, 15000];

const keyFor = (uid: string, type: string, value: number) =>
  `lishna:milestone:${uid}:${type}:${value}`;

/**
 * Auto-posts user_activities rows when the user hits a milestone.
 * Local de-duped via localStorage to prevent duplicate posts.
 */
export const useMilestoneTracker = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { learnedCount } = useUserWords();
  const lastFiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !profile) return;

    const post = async (activity_type: string, activity_data: Record<string, unknown>, dedupKey: string) => {
      if (lastFiredRef.current.has(dedupKey)) return;
      if (localStorage.getItem(dedupKey)) { lastFiredRef.current.add(dedupKey); return; }
      lastFiredRef.current.add(dedupKey);
      localStorage.setItem(dedupKey, '1');
      await supabase.from('user_activities').insert([{
        user_id: user.id, activity_type, activity_data,
      }]);
    };

    // Streak milestones
    if (STREAK_MILESTONES.includes(profile.streak)) {
      post('streak_milestone', { streak: profile.streak },
        keyFor(user.id, 'streak', profile.streak));
    }

    // Word milestones
    for (const m of WORD_MILESTONES) {
      if (learnedCount >= m) {
        post('words_milestone', { count: m }, keyFor(user.id, 'words', m));
      }
    }

    // League level-ups
    const rank = LEAGUE_THRESHOLDS.findIndex((t, i) =>
      profile.points >= t && (i === LEAGUE_THRESHOLDS.length - 1 || profile.points < LEAGUE_THRESHOLDS[i + 1])
    );
    if (rank > 0) {
      post('league_levelup', { rank }, keyFor(user.id, 'league', rank));
    }
  }, [user, profile, learnedCount]);
};
