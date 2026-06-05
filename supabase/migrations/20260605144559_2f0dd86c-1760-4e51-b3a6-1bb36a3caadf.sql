ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pass_plus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pass_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pass_claims_free integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pass_claims_plus integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pass_claims_pro integer[] NOT NULL DEFAULT '{}';

UPDATE public.profiles SET points = 0, daily_xp = 0, weekly_points = 0;