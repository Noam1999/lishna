CREATE TABLE public.ai_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  input_text text NOT NULL,
  context text,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_history_user_idx ON public.ai_history(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.ai_history TO authenticated;
GRANT ALL ON public.ai_history TO service_role;
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.ai_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.ai_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.ai_history FOR DELETE TO authenticated USING (auth.uid() = user_id);