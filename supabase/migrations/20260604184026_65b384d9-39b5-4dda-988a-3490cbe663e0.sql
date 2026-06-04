
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owned_skins text[] NOT NULL DEFAULT ARRAY['default']::text[],
  ADD COLUMN IF NOT EXISTS equipped_skin text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS wheel_spins integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL,
  guest_id uuid,
  status text NOT NULL DEFAULT 'waiting',
  current_question integer NOT NULL DEFAULT 0,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  host_score integer NOT NULL DEFAULT 0,
  guest_score integer NOT NULL DEFAULT 0,
  host_answer jsonb,
  guest_answer jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS duels_code_idx ON public.duels(code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.duels TO authenticated;
GRANT ALL ON public.duels TO service_role;

ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view duels"
  ON public.duels FOR SELECT TO authenticated USING (true);

CREATE POLICY "Host creates duel"
  ON public.duels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Players update their duel"
  ON public.duels FOR UPDATE TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id OR guest_id IS NULL);

CREATE POLICY "Host deletes duel"
  ON public.duels FOR DELETE TO authenticated
  USING (auth.uid() = host_id);

CREATE TRIGGER duels_updated_at BEFORE UPDATE ON public.duels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER TABLE public.duels REPLICA IDENTITY FULL;
