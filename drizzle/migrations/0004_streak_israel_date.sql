CREATE OR REPLACE FUNCTION public.update_quiz_streak()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; d integer; s integer; today date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  today := (now() AT TIME ZONE 'Asia/Jerusalem')::date;
  IF p.last_quiz_date IS NULL THEN s := 1;
  ELSE
    d := today - (p.last_quiz_date::timestamptz AT TIME ZONE 'Asia/Jerusalem')::date;
    s := CASE WHEN d = 0 THEN greatest(p.streak,1) WHEN d = 1 THEN p.streak + 1 ELSE 1 END;
  END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET streak = s, last_quiz_date = now() WHERE user_id = auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.update_quiz_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_quiz_streak() TO authenticated;