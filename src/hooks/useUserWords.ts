import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface UserWord {
  id: string;
  user_id: string;
  word_id: number;
  learned_at: string;
}

export const useUserWords = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [learnedWordIds, setLearnedWordIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch all learned words for the user
  const fetchLearnedWords = useCallback(async () => {
    if (!user) {
      setLearnedWordIds(new Set());
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_words')
      .select('word_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching learned words:', error);
    } else if (data) {
      setLearnedWordIds(new Set(data.map(row => row.word_id)));
    }
    setLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchLearnedWords();
  }, [fetchLearnedWords]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_words_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_words',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newWord = payload.new as UserWord;
            setLearnedWordIds(prev => new Set([...prev, newWord.word_id]));
          } else if (payload.eventType === 'DELETE') {
            const oldWord = payload.old as UserWord;
            setLearnedWordIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(oldWord.word_id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark a word as learned
  const markWordAsLearned = async (wordId: number): Promise<boolean> => {
    if (!user) return false;

    // Check if already learned
    if (learnedWordIds.has(wordId)) {
      return true; // Already learned, no need to add again
    }

    // Insert into user_words
    const { error: insertError } = await supabase
      .from('user_words')
      .insert({ user_id: user.id, word_id: wordId });

    if (insertError) {
      // Unique constraint violation means it's already learned
      if (insertError.code === '23505') {
        return true;
      }
      console.error('Error marking word as learned:', insertError);
      return false;
    }

    // Update the profile's words_mastered count
    if (profile) {
      await updateProfile({
        words_mastered: profile.words_mastered + 1,
      });
    }

    return true;
  };

  // Check if a word is learned
  const isWordLearned = (wordId: number): boolean => {
    return learnedWordIds.has(wordId);
  };

  // Get total count of learned words
  const learnedCount = learnedWordIds.size;

  return {
    learnedWordIds,
    learnedCount,
    loading,
    markWordAsLearned,
    isWordLearned,
    fetchLearnedWords,
  };
};
