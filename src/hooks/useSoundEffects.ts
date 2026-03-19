import { useCallback, useRef } from 'react';

const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568.wav',
  success: 'https://assets.mixkit.co/active_storage/sfx/2190/2190.wav',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572.wav',
};

export const useSoundEffects = () => {
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const play = useCallback((type: keyof typeof SOUNDS) => {
    try {
      if (!audioCache.current[type]) {
        audioCache.current[type] = new Audio(SOUNDS[type]);
        audioCache.current[type].volume = 0.3;
      }
      const audio = audioCache.current[type];
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  return { playClick: () => play('click'), playSuccess: () => play('success'), playError: () => play('error') };
};
