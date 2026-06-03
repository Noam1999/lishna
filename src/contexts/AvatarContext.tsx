import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_SKIN_ID } from '@/lib/skins';

interface AvatarState {
  owned: string[];
  equipped: string;
}

interface AvatarContextValue {
  owned: string[];
  equipped: string;
  ownsSkin: (id: string) => boolean;
  addSkin: (id: string) => void;
  equipSkin: (id: string) => void;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);
const STORAGE_PREFIX = 'lishna:avatar:';
const EVENT = 'lishna:avatar:update';

const readState = (userId: string): AvatarState => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owned: Array.from(new Set([DEFAULT_SKIN_ID, ...(parsed.owned ?? [])])),
        equipped: parsed.equipped || DEFAULT_SKIN_ID,
      };
    }
  } catch {}
  return { owned: [DEFAULT_SKIN_ID], equipped: DEFAULT_SKIN_ID };
};

const writeState = (userId: string, state: AvatarState) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {}
};

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.id ?? 'guest';
  const [state, setState] = useState<AvatarState>(() => readState(uid));

  useEffect(() => {
    setState(readState(uid));
    const sync = () => setState(readState(uid));
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [uid]);

  const addSkin = useCallback((id: string) => {
    const next: AvatarState = (() => {
      const cur = readState(uid);
      if (cur.owned.includes(id)) return cur;
      return { ...cur, owned: [...cur.owned, id] };
    })();
    writeState(uid, next);
    setState(next);
  }, [uid]);

  const equipSkin = useCallback((id: string) => {
    const cur = readState(uid);
    if (!cur.owned.includes(id)) return;
    const next = { ...cur, equipped: id };
    writeState(uid, next);
    setState(next);
  }, [uid]);

  const value = useMemo<AvatarContextValue>(() => ({
    owned: state.owned,
    equipped: state.equipped,
    ownsSkin: (id) => state.owned.includes(id),
    addSkin,
    equipSkin,
  }), [state, addSkin, equipSkin]);

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
};

export const useAvatar = () => {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider');
  return ctx;
};

// Lookup helper for arbitrary users (other people's skins are not synced yet → default).
export const getUserEquippedSkin = (userId: string | null | undefined): string => {
  if (!userId) return DEFAULT_SKIN_ID;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) return JSON.parse(raw).equipped || DEFAULT_SKIN_ID;
  } catch {}
  return DEFAULT_SKIN_ID;
};
