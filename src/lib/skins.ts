// Skin / outfit definitions for user avatars.
// Each skin has a rarity tier, price, emoji character, and a gradient background.
// Kept lightweight (emoji + gradient) for performance.

export type Rarity = 'free' | 'common' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'cosmic';

export interface Skin {
  id: string;
  name: string;
  rarity: Rarity;
  tierLabel: string;     // ספר תנ"כי
  coins: number;
  diamonds: number;
  emoji: string;         // ייצוג הדמות
  bg: string;            // Tailwind gradient classes
  ring: string;          // Tailwind ring color
  textTone: string;      // for badges
}

export const RARITY_LABEL: Record<Rarity, string> = {
  free: 'בסיסי',
  common: 'נפוץ',
  rare: 'נדיר',
  epic: 'נדיר ביותר',
  mythic: 'אפי',
  legendary: 'אגדי',
  cosmic: 'מיתולוגי',
};

export const SKINS: Skin[] = [
  {
    id: 'default',
    name: 'דמות בסיסית',
    rarity: 'free',
    tierLabel: 'התחלה',
    coins: 0,
    diamonds: 0,
    emoji: '🧑‍🎓',
    bg: 'from-slate-400 to-slate-600',
    ring: 'ring-slate-400/40',
    textTone: 'text-slate-100',
  },
  {
    id: 'beginner',
    name: 'תלבושת למתחילים',
    rarity: 'common',
    tierLabel: 'גמרא',
    coins: 400,
    diamonds: 0,
    emoji: '👨‍🎓',
    bg: 'from-emerald-400 to-green-600',
    ring: 'ring-emerald-400/50',
    textTone: 'text-emerald-50',
  },
  {
    id: 'sage',
    name: 'גלימת חכם',
    rarity: 'rare',
    tierLabel: 'משנה',
    coins: 750,
    diamonds: 0,
    emoji: '🧙',
    bg: 'from-sky-400 to-blue-700',
    ring: 'ring-sky-400/50',
    textTone: 'text-sky-50',
  },
  {
    id: 'king_david',
    name: 'לבוש מלכותי של דוד',
    rarity: 'epic',
    tierLabel: 'כתובים',
    coins: 1000,
    diamonds: 0,
    emoji: '🤴',
    bg: 'from-fuchsia-500 to-purple-700',
    ring: 'ring-purple-400/50',
    textTone: 'text-purple-50',
  },
  {
    id: 'haredi',
    name: 'חליפה חרדית מודרנית',
    rarity: 'mythic',
    tierLabel: 'נביאים',
    coins: 1250,
    diamonds: 5,
    emoji: '🕴️',
    bg: 'from-rose-500 to-red-800',
    ring: 'ring-red-400/50',
    textTone: 'text-red-50',
  },
  {
    id: 'kohen_gadol',
    name: 'בגדי כהן גדול',
    rarity: 'legendary',
    tierLabel: 'תורה',
    coins: 1500,
    diamonds: 10,
    emoji: '👼',
    bg: 'from-yellow-300 via-amber-400 to-yellow-600',
    ring: 'ring-yellow-300/70',
    textTone: 'text-amber-900',
  },
  {
    id: 'rishon_letzion',
    name: 'גלימת ראשון לציון',
    rarity: 'cosmic',
    tierLabel: 'תנ"ך',
    coins: 2000,
    diamonds: 20,
    emoji: '👳',
    bg: 'from-pink-500 via-purple-500 via-blue-500 to-emerald-500',
    ring: 'ring-pink-400/60',
    textTone: 'text-white',
  },
];

export const DEFAULT_SKIN_ID = 'default';
export const getSkin = (id: string | null | undefined): Skin =>
  SKINS.find((s) => s.id === id) ?? SKINS[0];
