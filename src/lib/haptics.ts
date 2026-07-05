// Lightweight haptic feedback wrapper for the WebVibration API.
// Safe no-op on unsupported devices/desktops.
// Respects the user's "haptic" preference in localStorage (key: "lishna:haptic").

const STORAGE_KEY = 'lishna:haptic';

export const isHapticEnabled = (): boolean => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    // Default ON if not set
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
};

export const setHapticEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
};

export const haptic = (pattern: number | number[] = 15) => {
  try {
    if (!isHapticEnabled()) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
};

/**
 * Attach a single delegated click listener so ANY button / link / role=button
 * across the app triggers a subtle 15ms vibration. Runs once per app load.
 */
let installed = false;
export const installGlobalHaptics = () => {
  if (installed) return;
  if (typeof document === 'undefined') return;
  installed = true;

  const handler = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest(
      'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], [role="radio"], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], label, summary, select'
    ) as HTMLElement | null;
    if (!el) return;
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
    haptic(15);
  };

  // Use pointerdown so it fires the moment the user taps.
  document.addEventListener('pointerdown', handler, { passive: true, capture: true });
};
