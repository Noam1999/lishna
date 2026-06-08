// Lishna Pass — 50-tier battle pass definition.
// Each tier requires exactly 150 XP. Rewards are deterministic per tier.

import { SKINS } from './skins';

export const XP_PER_TIER = 150;
export const PASS_TIERS = 50;
export const PASS_PLUS_PRICE = 25;   // diamonds
export const PASS_PRO_PRICE = 50;    // diamonds

export type RewardKind =
  | 'coins'
  | 'diamonds'
  | 'xp'
  | 'skin'
  | 'power_5050'
  | 'xp_mul'
  | 'coin_mul'
  | 'wheel_spin';

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
const p5050 = (n: number): Reward => ({ kind: 'power_5050', amount: n, label: `${n}× 50:50`, emoji: '🎯' });
const xpMul = (n: number): Reward => ({ kind: 'xp_mul', amount: n, label: `×2 XP ל-${n} מבחנים`, emoji: '⚡✨' });
const coinMul = (n: number): Reward => ({ kind: 'coin_mul', amount: n, label: `×2 מטבעות ל-${n} מבחנים`, emoji: '💰✨' });
const wheelR = (n: number): Reward => ({ kind: 'wheel_spin', amount: n, label: `${n} סיבובים בגלגל`, emoji: '🎡' });
const skinR = (id: string): Reward => {
  const s = SKINS.find((x) => x.id === id);
  return { kind: 'skin', skinId: id, label: s?.name || 'תלבושת', emoji: s?.emoji || '✨' };
};

const SKIN_FREE = ['beginner'];
const SKIN_PLUS = ['sage', 'king_david', 'haredi'];
const SKIN_PRO  = ['kohen_gadol', 'rishon_letzion'];

interface TierDef { free: Reward; plus: Reward; pro: Reward; }

export const TIERS: TierDef[] = Array.from({ length: PASS_TIERS }, (_, i) => {
  const tier = i + 1;

  // FREE: coins, xp, power-ups, occasional skin + wheel spin
  let free: Reward;
  if (tier === 25) free = skinR(SKIN_FREE[0]);
  else if (tier === 50) free = wheelR(3);
  else if (tier % 10 === 0) free = p5050(1);
  else if (tier % 7 === 0) free = wheelR(1);
  else if (tier % 5 === 0) free = coinR(150);
  else if (tier % 3 === 0) free = xpR(100);
  else free = coinR(50 + tier * 2);

  // PLUS: multipliers, diamonds, epic skins
  let plus: Reward;
  if (tier === 10) plus = skinR(SKIN_PLUS[0]);
  else if (tier === 25) plus = skinR(SKIN_PLUS[1]);
  else if (tier === 45) plus = skinR(SKIN_PLUS[2]);
  else if (tier === 50) plus = diaR(25);
  else if (tier % 8 === 0) plus = xpMul(3);
  else if (tier % 6 === 0) plus = coinMul(3);
  else if (tier % 4 === 0) plus = diaR(5);
  else if (tier % 2 === 0) plus = coinR(200 + tier * 5);
  else plus = p5050(1);

  // PRO: big diamonds, premium multipliers, legendary skins
  let pro: Reward;
  if (tier === 20) pro = skinR(SKIN_PRO[0]);
  else if (tier === 50) pro = skinR(SKIN_PRO[1]);
  else if (tier % 10 === 0) pro = diaR(20);
  else if (tier % 7 === 0) pro = xpMul(5);
  else if (tier % 5 === 0) pro = coinMul(5);
  else if (tier % 4 === 0) pro = wheelR(2);
  else if (tier % 2 === 0) pro = diaR(8);
  else pro = coinR(400 + tier * 10);

  return { free, plus, pro };
});

export const tierFromXp = (xp: number) => Math.min(PASS_TIERS, Math.floor(xp / XP_PER_TIER) + 1);
export const xpInTier = (xp: number) => xp % XP_PER_TIER;
