CREATE TABLE public.ai_usage (
  user_id uuid PRIMARY KEY,
  free_used integer NOT NULL DEFAULT 0,
  paid_used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_ai_use(_pay boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _free int; _d int;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'auth'); END IF;
  INSERT INTO ai_usage(user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  SELECT free_used INTO _free FROM ai_usage WHERE user_id = _uid FOR UPDATE;
  IF _free < 3 THEN
    UPDATE ai_usage SET free_used = free_used + 1, updated_at = now() WHERE user_id = _uid;
    RETURN jsonb_build_object('ok', true, 'free_left', 2 - _free);
  END IF;
  IF NOT _pay THEN RETURN jsonb_build_object('ok', false, 'reason', 'limit'); END IF;
  SELECT diamonds INTO _d FROM profiles WHERE user_id = _uid FOR UPDATE;
  IF coalesce(_d,0) < 1 THEN RETURN jsonb_build_object('ok', false, 'reason', 'diamonds'); END IF;
  PERFORM set_config('app.economy_ok', '1', true);
  UPDATE profiles SET diamonds = diamonds - 1 WHERE user_id = _uid;
  PERFORM set_config('app.economy_ok', '', true);
  UPDATE ai_usage SET paid_used = paid_used + 1, updated_at = now() WHERE user_id = _uid;
  RETURN jsonb_build_object('ok', true, 'free_left', 0, 'diamonds', _d - 1);
END $$;
REVOKE ALL ON FUNCTION public.consume_ai_use(boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.consume_ai_use(boolean) TO authenticated;