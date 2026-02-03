-- Create user_words table to track which words each user has learned
CREATE TABLE public.user_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word_id INTEGER NOT NULL,
  learned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_words ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own learned words" 
ON public.user_words 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark words as learned" 
ON public.user_words 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmark words" 
ON public.user_words 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_words;