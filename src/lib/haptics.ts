// Lightweight haptic feedback wrapper for the WebVibration API.
// Safe no-op on unsupported devices/desktops.
export const haptic = (pattern: number | number[] = 15) => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
};
