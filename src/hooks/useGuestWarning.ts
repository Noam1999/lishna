import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shows a browser confirmation dialog when a guest user tries to close/leave the tab.
 */
export const useGuestWarning = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || user) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message, but we set returnValue for compatibility
      e.returnValue = 'ההתקדמות שלך בארמית תלך לאיבוד. האם אתה בטוח שברצונך לצאת מבלי להירשם?';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [user, loading]);
};
