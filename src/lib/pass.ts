// Lishna Pass — 30-tier battle pass definition.
// Each tier requires exactly 150 XP. Rewards are deterministic per tier.

import { SKINS } from './skins';

export const XP_PER_TIER = 150;
export const PASS_TIERS = 30;
export const PASS_PLUS_PRICE = 25;   // diamonds
export const PASS_PRO_PRICE = 50;    // diamonds

export type RewardKind = 'coins' | 'diamonds' | 'xp' | 'skin';
export type Track = 'free' | 'plus' | 'pro';

export interface Reward {
  kind: RewardKind;
  amount?: number;
  skinId?: string;
  label: string;
  emoji: string;
}

const coinR = (n: number): Reward => ({ kind: 'coins', amount: n, label: `${n} מטבעות`, emoji: '🪙' });
const diaR = (n: number): Reward => ({ kind: 'diamonds', amount: n, label: `${n} יהלומים`, emoji: '💎' });
const xpR = (n: number): Reward => ({ kind: 'xp', amount: n, label: `+${n} XP`, emoji: '⚡' });
const skinR = (id: string): Reward => {
  const s = SKINS.find((x) => x.id === id);
  return { kind: 'skin', skinId: id, label: s?.name || 'תלבושת', emoji: s?.emoji || '✨' };
};

// Specific skins
const SKIN_FREE   = ['beginner'];                 // common
const SKIN_PLUS   = ['sage', 'king_david', 'haredi']; // rare/epic/mythic
const SKIN_PRO    = ['kohen_gadol', 'rishon_letzion']; // legendary/cosmic

interface TierDef { free: Reward; plus: Reward; pro: Reward; }

export const TIERS: TierDef[] = Array.from({ length: PASS_TIERS }, (_, i) => {
  const tier = i + 1;
  // FREE: coins & xp, with a common skin near the end
  let free: Reward;
  if (tier === 15) free = skinR(SKIN_FREE[0]);
  else if (tier % 5 === 0) free = coinR(150);
  else if (tier % 3 === 0) free = xpR(100);
  else free = coinR(50 + tier * 2);

  // PLUS: medium coins, diamonds, epic skins
  let plus: Reward;
  if (tier === 10) plus = skinR(SKIN_PLUS[0]);
  else if (tier === 20) plus = skinR(SKIN_PLUS[1]);
  else if (tier === 30) plus = skinR(SKIN_PLUS[2]);
  else if (tier % 4 === 0) plus = diaR(5);
  else if (tier % 2 === 0) plus = coinR(200 + tier * 5);
  else plus = xpR(150);

  // PRO: large coins, big diamonds, legendary skins
  let pro: Reward;
  if (tier === 15) pro = skinR(SKIN_PRO[0]);
  else if (tier === 30) pro = skinR(SKIN_PRO[1]);
  else if (tier % 5 === 0) pro = diaR(15);
  else if (tier % 2 === 0) pro = diaR(8);
  else pro = coinR(400 + tier * 10);

  return { free, plus, pro };
});

export const tierFromXp = (xp: number) => Math.min(PASS_TIERS, Math.floor(xp / XP_PER_TIER) + 1);
export const xpInTier = (xp: number) => xp % XP_PER_TIER;
