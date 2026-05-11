
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS diamonds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_wheel_spin_at timestamptz;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{"allowPowerUps": true, "shuffleQuestions": false, "timerEnabled": false, "secondsPerQuestion": 20}'::jsonb;
