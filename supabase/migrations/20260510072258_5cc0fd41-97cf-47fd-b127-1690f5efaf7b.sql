ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_multiplier_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coin_multiplier_remaining integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS power_up_5050 integer NOT NULL DEFAULT 0;