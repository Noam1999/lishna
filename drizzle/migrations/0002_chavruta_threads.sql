CREATE TABLE public.chavruta_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_title text NOT NULL,
  page_text text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chavruta_threads_user_idx ON public.chavruta_threads(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chavruta_threads TO authenticated;
GRANT ALL ON public.chavruta_threads TO service_role;
ALTER TABLE public.chavruta_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.chavruta_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.chavruta_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.chavruta_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.chavruta_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);