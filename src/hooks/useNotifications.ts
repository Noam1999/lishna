import { useCallback, useEffect, useState } from 'react';

const isPreview = () => {
  if (typeof window === 'undefined') return true;
  const h = window.location.hostname;
  return (
    window.self !== window.top ||
    h.startsWith('id-preview--') ||
    h.startsWith('preview--') ||
    h === 'lovableproject.com' || h.endsWith('.lovableproject.com') ||
    h === 'lovableproject-dev.com' || h.endsWith('.lovableproject-dev.com') ||
    h === 'beta.lovable.dev' || h.endsWith('.beta.lovable.dev') ||
    window.location.search.includes('sw=off')
  );
};

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationsSupported() ? Notification.permission : 'default'
  );

  // Register SW only in production / installed PWA contexts.
  useEffect(() => {
    if (!notificationsSupported() || isPreview()) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const requestPermission = useCallback(async () => {
    if (!notificationsSupported()) return 'denied' as NotificationPermission;
    const p = await Notification.requestPermission();
    setPermission(p);
    return p;
  }, []);

  const notify = useCallback(async (title: string, body: string, tag?: string) => {
    if (!notificationsSupported() || Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        reg.showNotification(title, { body, icon: '/icon-192.png', badge: '/favicon-32.png', tag, dir: 'rtl', lang: 'he' });
      } else {
        new Notification(title, { body, icon: '/icon-192.png', tag, dir: 'rtl', lang: 'he' });
      }
    } catch {}
  }, []);

  return { permission, requestPermission, notify, supported: notificationsSupported() };
};
