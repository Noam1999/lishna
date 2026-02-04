-- Add weekly_points column to profiles for tracking current week's points
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS week_start_date date;

-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Users can view all achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own achievements" 
ON public.achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create season_history table for past weekly rankings
CREATE TABLE public.season_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  final_rank integer NOT NULL,
  final_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number, year)
);

-- Enable RLS on season_history
ALTER TABLE public.season_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for season_history
CREATE POLICY "Users can view all season history" 
ON public.season_history 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert season history" 
ON public.season_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);