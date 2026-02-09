import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from './useFriends';

export interface ActivityWithProfile {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, unknown> | null;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  celebration_count: number;
  user_celebrated: boolean;
}

export const useActivityFeed = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [activities, setActivities] = useState<ActivityWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const friendUserIds = friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user_id === user.id ? f.friend_id : f.user_id);

    // Include own activities + friends'
    const allUserIds = [user.id, ...friendUserIds];

    if (allUserIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const { data: activityData, error } = await supabase
      .from('user_activities')
      .select('*')
      .in('user_id', allUserIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
      return;
    }

    if (!activityData || activityData.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', allUserIds);

    // Fetch celebrations
    const activityIds = activityData.map(a => a.id);
    const { data: celebrations } = await supabase
      .from('activity_celebrations')
      .select('activity_id, user_id')
      .in('activity_id', activityIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const enriched: ActivityWithProfile[] = activityData.map(activity => {
      const profile = profileMap.get(activity.user_id);
      const actCelebrations = celebrations?.filter(c => c.activity_id === activity.id) || [];
      return {
        id: activity.id,
        user_id: activity.user_id,
        activity_type: activity.activity_type,
        activity_data: activity.activity_data as Record<string, unknown> | null,
        created_at: activity.created_at,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        celebration_count: actCelebrations.length,
        user_celebrated: actCelebrations.some(c => c.user_id === user.id),
      };
    });

    setActivities(enriched);
    setLoading(false);
  }, [user, friends]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const celebrateActivity = async (activityId: string) => {
    if (!user) return;

    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    if (activity.user_celebrated) {
      // Remove celebration
      await supabase
        .from('activity_celebrations')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', user.id);

      setActivities(prev =>
        prev.map(a =>
          a.id === activityId
            ? { ...a, celebration_count: a.celebration_count - 1, user_celebrated: false }
            : a
        )
      );
    } else {
      // Add celebration
      await supabase
        .from('activity_celebrations')
        .insert({ activity_id: activityId, user_id: user.id });

      setActivities(prev =>
        prev.map(a =>
          a.id === activityId
            ? { ...a, celebration_count: a.celebration_count + 1, user_celebrated: true }
            : a
        )
      );
    }
  };

  return { activities, loading, fetchActivities, celebrateActivity };
};
