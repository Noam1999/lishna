
-- Create custom_words table for admin-managed words
CREATE TABLE public.custom_words (
  id SERIAL PRIMARY KEY,
  aramaic TEXT NOT NULL,
  hebrew TEXT NOT NULL,
  word_type TEXT NOT NULL DEFAULT 'שם עצם',
  cultural_context TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_words ENABLE ROW LEVEL SECURITY;

-- Everyone can read custom words
CREATE POLICY "Anyone can view custom words"
ON public.custom_words
FOR SELECT
TO public
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert custom words"
ON public.custom_words
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete custom words"
ON public.custom_words
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
