// Lightweight synthesized audio (Web Audio API). No external files.
// Respects the user's "audio" preference in localStorage (key: "lishna:audio").

const STORAGE_KEY = 'lishna:audio';

export const isAudioEnabled = (): boolean => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
};

export const setAudioEnabled = (enabled: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
  if (!enabled) stopDuelBgm();
};

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
};

const beep = (
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  startOffset = 0,
  freqEnd?: number,
) => {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
};

export const sfxCorrect = () => {
  if (!isAudioEnabled()) return;
  // Cheerful ding: two ascending pure tones
  beep(880, 0.14, 'triangle', 0.18, 0);
  beep(1318.5, 0.22, 'triangle', 0.18, 0.09);
};

export const sfxIncorrect = () => {
  if (!isAudioEnabled()) return;
  // Soft low buzzer descending
  beep(220, 0.18, 'sawtooth', 0.09, 0, 130);
  beep(160, 0.18, 'square', 0.05, 0.05, 110);
};

export const sfxCoin = () => {
  if (!isAudioEnabled()) return;
  // Retro coin: quick ascending crystal notes
  const notes = [988, 1319, 1568, 1976];
  notes.forEach((f, i) => beep(f, 0.09, 'square', 0.1, i * 0.05));
  beep(2637, 0.16, 'triangle', 0.12, 0.22);
};

// ---- Duel BGM: looping tense synth/percussion beat ----
let bgmNodes: { stop: () => void } | null = null;

export const startDuelBgm = () => {
  if (!isAudioEnabled()) return;
  if (bgmNodes) return;
  const ac = getCtx();
  if (!ac) return;

  const master = ac.createGain();
  master.gain.value = 0.0001;
  master.connect(ac.destination);
  master.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 0.8);

  // Low tense drone
  const drone = ac.createOscillator();
  drone.type = 'sawtooth';
  drone.frequency.value = 55;
  const droneGain = ac.createGain();
  droneGain.gain.value = 0.25;
  const droneFilter = ac.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 180;
  drone.connect(droneFilter).connect(droneGain).connect(master);
  drone.start();

  // Rhythmic percussion via noise bursts
  const bpm = 120;
  const stepDur = 60 / bpm / 2; // eighth notes
  let step = 0;
  const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0];
  const hatPattern = [0, 1, 0, 1, 0, 1, 0, 1];
  const bassPattern = [55, 0, 0, 82, 55, 0, 73, 0];

  const kick = () => {
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.2);
  };

  const hat = () => {
    const t = ac.currentTime;
    const bufferSize = 0.05 * ac.sampleRate;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(hp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.06);
  };

  const bass = (freq: number) => {
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 0.9);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + stepDur);
  };

  const interval = window.setInterval(() => {
    const i = step % 8;
    if (kickPattern[i]) kick();
    if (hatPattern[i]) hat();
    if (bassPattern[i]) bass(bassPattern[i]);
    step++;
  }, stepDur * 1000);

  bgmNodes = {
    stop: () => {
      try {
        clearInterval(interval);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setValueAtTime(master.gain.value, ac.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
        setTimeout(() => {
          try { drone.stop(); } catch { /* noop */ }
          try { master.disconnect(); } catch { /* noop */ }
        }, 600);
      } catch {
        // ignore
      }
    },
  };
};

export const stopDuelBgm = () => {
  if (bgmNodes) {
    bgmNodes.stop();
    bgmNodes = null;
  }
};
