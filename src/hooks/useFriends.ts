import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from './useProfile';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface FriendWithProfile extends Friendship {
  profile: Profile | null;
}

// Helper function to remove niqqud for search
const removeNiqqud = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0591-\u05C7]/g, "").toLowerCase();
};

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriends();
    } else {
      setFriends([]);
      setPendingRequests([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch all friendships where user is involved
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friendships:', error);
      setLoading(false);
      return;
    }

    if (!friendships) {
      setLoading(false);
      return;
    }

    // Get all related user IDs
    const friendIds = friendships.map(f => 
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    // Fetch profiles for all friends
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', friendIds);

    // Combine friendships with profiles
    const friendsWithProfiles: FriendWithProfile[] = friendships.map(friendship => ({
      ...friendship,
      status: friendship.status as 'pending' | 'accepted' | 'rejected',
      profile: profiles?.find(p => 
        p.user_id === (friendship.user_id === user.id ? friendship.friend_id : friendship.user_id)
      ) || null,
    }));

    // Separate accepted friends from pending requests
    const acceptedFriends = friendsWithProfiles.filter(f => f.status === 'accepted');
    const pending = friendsWithProfiles.filter(
      f => f.status === 'pending' && f.friend_id === user.id
    );

    setFriends(acceptedFriends);
    setPendingRequests(pending);
    setLoading(false);
  };

  const searchUsers = async (query: string): Promise<Profile[]> => {
    if (!query || query.length < 2) return [];

    const normalizedQuery = removeNiqqud(query);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user?.id || '');

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    // Filter by normalized name
    return (data || []).filter(profile => {
      const name = profile.display_name || profile.username || '';
      return removeNiqqud(name).includes(normalizedQuery);
    });
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

    if (!error) {
      await fetchFriends();
    }

    return { error };
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriends();
    }

    return { error };
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriends();
    }

    return { error };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriends();
    }

    return { error };
  };

  return {
    friends,
    pendingRequests,
    loading,
    fetchFriends,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
};
