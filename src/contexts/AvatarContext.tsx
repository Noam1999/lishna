import { createContext, useCallback, useContext, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { DEFAULT_SKIN_ID } from '@/lib/skins';

interface AvatarContextValue {
  owned: string[];
  equipped: string;
  ownsSkin: (id: string) => boolean;
  addSkin: (id: string) => Promise<void>;
  equipSkin: (id: string) => Promise<void>;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

// Cache of other users' equipped skins, populated lazily.
const otherSkinCache = new Map<string, string>();
const fetchInflight = new Map<string, Promise<string>>();
const EVENT = 'lishna:avatar:update';

export const fetchUserSkin = (userId: string): Promise<string> => {
  if (otherSkinCache.has(userId)) return Promise.resolve(otherSkinCache.get(userId)!);
  if (fetchInflight.has(userId)) return fetchInflight.get(userId)!;
  const p = (async () => {
    const { data } = await supabase
      .from('profiles')
      .select('equipped_skin')
      .eq('user_id', userId)
      .maybeSingle();
    const skin = ((data?.equipped_skin as string) || DEFAULT_SKIN_ID);
    otherSkinCache.set(userId, skin);
    fetchInflight.delete(userId);
    return skin;
  })();
  fetchInflight.set(userId, p);
  return p;
};

export const getCachedUserSkin = (userId: string | null | undefined): string => {
  if (!userId) return DEFAULT_SKIN_ID;
  if (otherSkinCache.has(userId)) return otherSkinCache.get(userId)!;
  return DEFAULT_SKIN_ID;
};

export const primeUserSkin = (userId: string, skin: string) => {
  otherSkinCache.set(userId, skin || DEFAULT_SKIN_ID);
};

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { profile, updateProfile, buySkin } = useProfile();

  const owned = profile?.owned_skins ?? [DEFAULT_SKIN_ID];
  const equipped = profile?.equipped_skin || DEFAULT_SKIN_ID;

  // Keep current user's skin primed for any UserAvatar instances referencing by id.
  if (user) primeUserSkin(user.id, equipped);

  // Skins are granted only by the server (purchase / pass reward).
  const addSkin = useCallback(async (id: string) => {
    if (!profile) return;
    if (owned.includes(id)) return;
    await buySkin(id);
  }, [profile, owned, buySkin]);

  const equipSkin = useCallback(async (id: string) => {
    if (!profile || !owned.includes(id)) return;
    await updateProfile({ equipped_skin: id });
    if (user) primeUserSkin(user.id, id);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, [profile, owned, updateProfile, user]);

  const value = useMemo<AvatarContextValue>(() => ({
    owned,
    equipped,
    ownsSkin: (id) => owned.includes(id),
    addSkin,
    equipSkin,
  }), [owned, equipped, addSkin, equipSkin]);

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
};

export const useAvatar = () => {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider');
  return ctx;
};

// Backward-compat helper used in older files.
export const getUserEquippedSkin = getCachedUserSkin;
