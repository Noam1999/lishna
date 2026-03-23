import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  weekly_points: number;
  points: number;
  rank?: number;
}

export interface SeasonHistory {
  id: string;
  week_number: number;
  year: number;
  final_rank: number;
  final_points: number;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [seasonHistory, setSeasonHistory] = useState<SeasonHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
    fetchSeasonHistory();
  }, [user, friends]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    
    // Fetch global leaderboard - top users by weekly_points
    const { data: globalData, error: globalError } = await supabase
      .from('profiles')
      .select('id, user_id, username, display_name, avatar_url, weekly_points, points')
      .order('weekly_points', { ascending: false })
      .limit(10);

    if (globalError) {
      console.error('Error fetching global leaderboard:', globalError);
    } else if (globalData) {
      const rankedGlobal = globalData.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      setGlobalLeaderboard(rankedGlobal);
      
      // Find current user's rank
      if (user) {
        const userEntry = rankedGlobal.find(e => e.user_id === user.id);
        if (userEntry) {
          setUserRank(userEntry);
        }
      }
    }

    // Fetch friends leaderboard
    if (user && friends.length > 0) {
      const friendIds = friends.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );
      // Include current user in friends leaderboard
      friendIds.push(user.id);

      const { data: friendsData, error: friendsError } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url, weekly_points, points')
        .in('user_id', friendIds)
        .order('weekly_points', { ascending: false });

      if (friendsError) {
        console.error('Error fetching friends leaderboard:', friendsError);
      } else if (friendsData) {
        const rankedFriends = friendsData.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
        setFriendsLeaderboard(rankedFriends);
      }
    }

    setLoading(false);
  };

  const fetchSeasonHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('season_history')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching season history:', error);
    } else {
      setSeasonHistory(data || []);
    }
  };

  const addWeeklyPoints = async (pointsToAdd: number) => {
    if (!user) return;

    const today = new Date();
    const currentWeekStart = getWeekStart(today);

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('weekly_points, week_start_date')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    let newWeeklyPoints = pointsToAdd;
    
    // If same week, add to existing points
    if (profile.week_start_date === currentWeekStart) {
      newWeeklyPoints = (profile.weekly_points || 0) + pointsToAdd;
    }

    // Update weekly points
    await supabase
      .from('profiles')
      .update({
        weekly_points: newWeeklyPoints,
        week_start_date: currentWeekStart
      })
      .eq('user_id', user.id);

    // Refresh leaderboards
    fetchLeaderboards();
  };

  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  return {
    globalLeaderboard,
    friendsLeaderboard,
    userRank,
    seasonHistory,
    loading,
    addWeeklyPoints,
    refetch: fetchLeaderboards
  };
};
