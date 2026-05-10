## Economy & Shop System

Add Lishna Coins, an XP rewards system tied to test/assignment scores, and a Shop where students spend coins on multipliers and power-ups.

### 1. Database (migration)

Extend `profiles` with economy columns:
- `coins` (integer, default 0)
- `xp_multiplier_remaining` (integer, default 0) — number of tests remaining with 2× XP
- `coin_multiplier_remaining` (integer, default 0) — number of tests remaining with 2× coins
- `power_up_5050` (integer, default 0) — quantity of 50/50 power-ups owned

Note: `points` already exists and acts as XP.

### 2. Reward logic

After every quiz/assignment completion:
- Coins earned = score (× 2 if `coin_multiplier_remaining > 0`)
- XP earned = score (× 2 if `xp_multiplier_remaining > 0`)
- Decrement multiplier counters by 1 if active
- Update via new helper in `useProfile` (e.g. `awardScoreRewards(score)`)

Apply in: `Quiz.tsx` (on quiz complete) and `TakeAssignment.tsx` (on submit).

### 3. Shop page (`/shop`)

New `src/pages/Shop.tsx`:
- Header with coin (💰) and XP (✨) balance
- 3 item cards:
  - ✨ מכפיל XP — 500 coins — doubles XP for next 3 tests
  - 💰 מכפיל מטבעות — 500 coins — doubles coins for next 3 tests
  - ⚡ כוח 50:50 — 200 coins — removes 2 wrong answers in a quiz
- "רכישה" button on each card (disabled if not enough coins)
- Purchase deducts coins and increments the relevant counter (multipliers add 3 uses; power-up adds 1)
- Success animation: framer-motion scale+confetti-style overlay with toast "רכישה הושלמה!"
- Show active multiplier badges ("מכפיל XP פעיל: 2 מבחנים נותרו")

Add route in `App.tsx`. Add a shop button on Home screen and a small balance chip in `Header.tsx` (showing coins + XP) wherever profile is loaded.

### 4. 50/50 power-up in Quiz

In `Quiz.tsx`:
- Add ⚡ button (visible only if `profile.power_up_5050 > 0` and current question has 4+ options)
- On click: pick 2 wrong answers and visually disable/hide them, decrement `power_up_5050` in DB, mark used for the current question (local state — one use per question)

### 5. Persistence

All economy state lives on `profiles` (already persisted). `useProfile` exposes:
- `awardScoreRewards(score)` — applies coins/XP with active multipliers and decrements
- `purchaseItem(item)` — validates coins, deducts, increments item
- `usePowerUp5050()` — decrements `power_up_5050`

### 6. UI polish

- Coin/XP badges in `Header.tsx` (small pills, animated number on change)
- Shop card hover/tap with framer-motion spring
- Purchase success: scale-in checkmark with sonner toast
- Shop entry: floating button on Home + nav-style entry

### Files

- migration: add columns to `profiles`
- new: `src/pages/Shop.tsx`
- edit: `src/hooks/useProfile.ts` (new helpers)
- edit: `src/components/Header.tsx` (balance chip — optional prop)
- edit: `src/pages/Home.tsx` (Shop entry button)
- edit: `src/pages/Quiz.tsx` (50/50 button + reward call)
- edit: `src/pages/TakeAssignment.tsx` (reward call)
- edit: `src/App.tsx` (route)
