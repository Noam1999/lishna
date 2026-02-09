-- Table for activity celebrations (likes/high-fives)
CREATE TABLE public.activity_celebrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.user_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  celebration_type TEXT NOT NULL DEFAULT 'high_five',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.activity_celebrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_celebrations
CREATE POLICY "Users can view all celebrations"
ON public.activity_celebrations
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own celebrations"
ON public.activity_celebrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own celebrations"
ON public.activity_celebrations
FOR DELETE
USING (auth.uid() = user_id);

-- Table for daily quests
CREATE TABLE public.daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quest_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  bonus_xp INTEGER NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_date, quest_type)
);

-- Enable RLS
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_quests
CREATE POLICY "Users can view their own quests"
ON public.daily_quests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quests"
ON public.daily_quests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quests"
ON public.daily_quests
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_daily_quests_user_date ON public.daily_quests(user_id, quest_date);
CREATE INDEX idx_activity_celebrations_activity ON public.activity_celebrations(activity_id);