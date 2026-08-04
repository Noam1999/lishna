CREATE OR REPLACE FUNCTION public.award_quiz_rewards(_score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; v_xp integer; v_coins integer; v_today date := current_date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  _score := least(greatest(coalesce(_score,0), 0), 100);
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND OR _score = 0 THEN RETURN jsonb_build_object('coinsEarned',0,'xpEarned',0); END IF;
  v_xp := _score * CASE WHEN p.xp_multiplier_remaining > 0 THEN 2 ELSE 1 END;
  v_coins := _score * CASE WHEN p.coin_multiplier_remaining > 0 THEN 2 ELSE 1 END;
  PERFORM public.economy_open();
  UPDATE public.profiles SET
    points = points + v_xp,
    coins = coins + v_coins,
    daily_xp = CASE WHEN last_xp_date IS DISTINCT FROM v_today THEN v_xp ELSE daily_xp + v_xp END,
    last_xp_date = v_today,
    xp_multiplier_remaining = greatest(0, xp_multiplier_remaining - 1),
    coin_multiplier_remaining = greatest(0, coin_multiplier_remaining - 1)
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coinsEarned', v_coins, 'xpEarned', v_xp);
END; $$;

REVOKE ALL ON FUNCTION public.award_quiz_rewards(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_quiz_rewards(integer) TO authenticated;