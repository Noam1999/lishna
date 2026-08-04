-- ============ 1. PROFILES: block direct economy edits ============
CREATE OR REPLACE FUNCTION public.guard_profile_economy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('app.economy_ok', true), '') = '1'
     OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.points := OLD.points;
  NEW.coins := OLD.coins;
  NEW.diamonds := OLD.diamonds;
  NEW.words_mastered := OLD.words_mastered;
  NEW.streak := OLD.streak;
  NEW.daily_xp := OLD.daily_xp;
  NEW.weekly_points := OLD.weekly_points;
  NEW.week_start_date := OLD.week_start_date;
  NEW.last_xp_date := OLD.last_xp_date;
  NEW.last_quiz_date := OLD.last_quiz_date;
  NEW.power_up_5050 := OLD.power_up_5050;
  NEW.xp_multiplier_remaining := OLD.xp_multiplier_remaining;
  NEW.coin_multiplier_remaining := OLD.coin_multiplier_remaining;
  NEW.wheel_spins := OLD.wheel_spins;
  NEW.last_wheel_spin_at := OLD.last_wheel_spin_at;
  NEW.owned_skins := OLD.owned_skins;
  NEW.pass_plus := OLD.pass_plus;
  NEW.pass_pro := OLD.pass_pro;
  NEW.pass_claims_free := OLD.pass_claims_free;
  NEW.pass_claims_plus := OLD.pass_claims_plus;
  NEW.pass_claims_pro := OLD.pass_claims_pro;
  NEW.last_perk_grant_date := OLD.last_perk_grant_date;

  -- equipped skin must be owned
  IF NEW.equipped_skin IS DISTINCT FROM OLD.equipped_skin
     AND NOT (NEW.equipped_skin = ANY (coalesce(NEW.owned_skins, ARRAY['default']::text[])))
     AND NEW.equipped_skin <> 'default' THEN
    NEW.equipped_skin := OLD.equipped_skin;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_economy ON public.profiles;
CREATE TRIGGER guard_profile_economy
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_economy();

-- helper: open the economy gate inside definer RPCs
CREATE OR REPLACE FUNCTION public.economy_open()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS
$$ SELECT set_config('app.economy_ok', '1', true); $$;

-- ============ 2. ECONOMY RPCs ============
CREATE OR REPLACE FUNCTION public.add_points(_pts integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_today date := current_date; p public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  _pts := least(greatest(coalesce(_pts,0), 0), 500);
  PERFORM public.economy_open();
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.profiles SET
    points = points + _pts,
    daily_xp = CASE WHEN last_xp_date IS DISTINCT FROM v_today THEN _pts ELSE daily_xp + _pts END,
    last_xp_date = v_today
  WHERE user_id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.award_quiz_rewards(_score integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; xp integer; coins integer; v_today date := current_date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  _score := least(greatest(coalesce(_score,0), 0), 100);
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND OR _score = 0 THEN RETURN jsonb_build_object('coinsEarned',0,'xpEarned',0); END IF;
  xp := _score * CASE WHEN p.xp_multiplier_remaining > 0 THEN 2 ELSE 1 END;
  coins := _score * CASE WHEN p.coin_multiplier_remaining > 0 THEN 2 ELSE 1 END;
  PERFORM public.economy_open();
  UPDATE public.profiles SET
    points = points + xp,
    coins = coins + coins,
    daily_xp = CASE WHEN last_xp_date IS DISTINCT FROM v_today THEN xp ELSE daily_xp + xp END,
    last_xp_date = v_today,
    xp_multiplier_remaining = greatest(0, xp_multiplier_remaining - 1),
    coin_multiplier_remaining = greatest(0, coin_multiplier_remaining - 1)
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coinsEarned', coins, 'xpEarned', xp);
END; $$;

CREATE OR REPLACE FUNCTION public.update_quiz_streak()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; d integer; s integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN; END IF;
  IF p.last_quiz_date IS NULL THEN s := 1;
  ELSE
    d := (current_date - p.last_quiz_date::date);
    s := CASE WHEN d = 0 THEN greatest(p.streak,1) WHEN d = 1 THEN p.streak + 1 ELSE 1 END;
  END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET streak = s, last_quiz_date = now() WHERE user_id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.sync_words_mastered()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT count(*) INTO c FROM public.user_words WHERE user_id = auth.uid();
  PERFORM public.economy_open();
  UPDATE public.profiles SET words_mastered = c WHERE user_id = auth.uid();
  RETURN c;
END; $$;

CREATE OR REPLACE FUNCTION public.purchase_shop_item(_item text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE price integer; p public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  price := CASE _item WHEN 'xp_multiplier' THEN 500 WHEN 'coin_multiplier' THEN 500 WHEN 'power_up_5050' THEN 200 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'invalid_item'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  IF p.coins < price THEN RETURN jsonb_build_object('error','not_enough_coins'); END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET
    coins = coins - price,
    xp_multiplier_remaining = xp_multiplier_remaining + CASE WHEN _item='xp_multiplier' THEN 3 ELSE 0 END,
    coin_multiplier_remaining = coin_multiplier_remaining + CASE WHEN _item='coin_multiplier' THEN 3 ELSE 0 END,
    power_up_5050 = power_up_5050 + CASE WHEN _item='power_up_5050' THEN 1 ELSE 0 END
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.use_power_up_5050()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT power_up_5050 INTO n FROM public.profiles WHERE user_id = auth.uid();
  IF coalesce(n,0) <= 0 THEN RETURN jsonb_build_object('error','none'); END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET power_up_5050 = power_up_5050 - 1 WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.exchange_currency(_direction text, _amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; cost integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF coalesce(_amount,0) <= 0 OR _amount > 100000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  PERFORM public.economy_open();
  IF _direction = 'coins_to_diamonds' THEN
    cost := _amount * 100;
    IF p.coins < cost THEN RETURN jsonb_build_object('error','not_enough_coins'); END IF;
    UPDATE public.profiles SET coins = coins - cost, diamonds = diamonds + _amount WHERE user_id = auth.uid();
  ELSIF _direction = 'diamonds_to_coins' THEN
    IF p.diamonds < _amount THEN RETURN jsonb_build_object('error','not_enough_diamonds'); END IF;
    UPDATE public.profiles SET diamonds = diamonds - _amount, coins = coins + _amount * 100 WHERE user_id = auth.uid();
  ELSE RAISE EXCEPTION 'invalid_direction';
  END IF;
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.profiles;
  weights numeric[] := ARRAY[31, 9, 15, 5, 0.09, 9, 20.91, 10];
  kinds text[] := ARRAY['coins','none','coins','diamonds','coins','none','diamonds','coins'];
  amounts integer[] := ARRAY[1, 0, 50, 5, 1000, 0, 1, 100];
  total numeric := 0; r numeric; idx integer := 8; i integer; bonus boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('error','no_profile'); END IF;
  bonus := coalesce(p.wheel_spins,0) > 0;
  IF NOT bonus AND p.last_wheel_spin_at IS NOT NULL AND p.last_wheel_spin_at > now() - interval '24 hours' THEN
    RETURN jsonb_build_object('error','cooldown');
  END IF;
  FOR i IN 1..8 LOOP total := total + weights[i]; END LOOP;
  r := random() * total;
  FOR i IN 1..8 LOOP
    r := r - weights[i];
    IF r <= 0 THEN idx := i; EXIT; END IF;
  END LOOP;
  PERFORM public.economy_open();
  UPDATE public.profiles SET
    wheel_spins = CASE WHEN bonus THEN wheel_spins - 1 ELSE wheel_spins END,
    last_wheel_spin_at = CASE WHEN bonus THEN last_wheel_spin_at ELSE now() END,
    coins = coins + CASE WHEN kinds[idx] = 'coins' THEN amounts[idx] ELSE 0 END,
    diamonds = diamonds + CASE WHEN kinds[idx] = 'diamonds' THEN amounts[idx] ELSE 0 END
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('segmentIndex', idx - 1, 'kind', kinds[idx], 'amount', amounts[idx]);
END; $$;

CREATE OR REPLACE FUNCTION public.buy_skin(_skin_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; c integer; d integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT x.c, x.d INTO c, d FROM (VALUES
    ('default',0,0),('beginner',400,0),('sage',750,0),('king_david',1000,0),
    ('haredi',1250,5),('kohen_gadol',1500,10),('rishon_letzion',2000,20)
  ) AS x(id, c, d) WHERE x.id = _skin_id;
  IF c IS NULL THEN RAISE EXCEPTION 'invalid_skin'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  IF _skin_id = ANY (coalesce(p.owned_skins, '{}')) THEN RETURN jsonb_build_object('ok', true); END IF;
  IF p.coins < c OR p.diamonds < d THEN RETURN jsonb_build_object('error','not_enough_funds'); END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET coins = coins - c, diamonds = diamonds - d,
    owned_skins = array_append(coalesce(owned_skins,'{}'), _skin_id)
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.buy_pass(_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; price integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  price := CASE _kind WHEN 'plus' THEN 25 WHEN 'pro' THEN 50 ELSE NULL END;
  IF price IS NULL THEN RAISE EXCEPTION 'invalid_kind'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  IF (_kind = 'plus' AND p.pass_plus) OR (_kind = 'pro' AND p.pass_pro) THEN RETURN jsonb_build_object('ok', true); END IF;
  IF p.diamonds < price THEN RETURN jsonb_build_object('error','not_enough_diamonds'); END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET diamonds = diamonds - price,
    pass_plus = pass_plus OR (_kind = 'plus'),
    pass_pro = pass_pro OR (_kind = 'pro')
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.claim_pass_reward(_track text, _tier integer, _kind text, _amount integer, _skin_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; claims integer[]; col text; amt integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _track NOT IN ('free','plus','pro') THEN RAISE EXCEPTION 'invalid_track'; END IF;
  IF _tier < 1 OR _tier > 50 THEN RAISE EXCEPTION 'invalid_tier'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'no_profile'; END IF;
  -- track must be owned
  IF (_track = 'plus' AND NOT p.pass_plus) OR (_track = 'pro' AND NOT p.pass_pro) THEN
    RETURN jsonb_build_object('error','track_locked');
  END IF;
  -- tier must be unlocked by XP (150 XP per tier)
  IF p.points < _tier * 150 THEN RETURN jsonb_build_object('error','tier_locked'); END IF;
  claims := CASE _track WHEN 'free' THEN p.pass_claims_free WHEN 'plus' THEN p.pass_claims_plus ELSE p.pass_claims_pro END;
  IF _tier = ANY (coalesce(claims,'{}')) THEN RETURN jsonb_build_object('error','already_claimed'); END IF;

  amt := coalesce(_amount, 0);
  -- server-side caps per reward kind
  amt := CASE _kind
    WHEN 'coins' THEN least(amt, 500)
    WHEN 'diamonds' THEN least(amt, 25)
    WHEN 'xp' THEN least(amt, 200)
    WHEN 'power_5050' THEN least(amt, 3)
    WHEN 'xp_mul' THEN least(amt, 5)
    WHEN 'coin_mul' THEN least(amt, 5)
    WHEN 'wheel_spin' THEN least(amt, 3)
    WHEN 'skin' THEN 0
    ELSE NULL END;
  IF amt IS NULL THEN RAISE EXCEPTION 'invalid_reward'; END IF;
  amt := greatest(amt, 0);

  IF _kind = 'skin' AND (_skin_id IS NULL OR _skin_id NOT IN
      ('beginner','sage','king_david','haredi','kohen_gadol','rishon_letzion')) THEN
    RAISE EXCEPTION 'invalid_skin';
  END IF;

  PERFORM public.economy_open();
  UPDATE public.profiles SET
    coins = coins + CASE WHEN _kind='coins' THEN amt ELSE 0 END,
    diamonds = diamonds + CASE WHEN _kind='diamonds' THEN amt ELSE 0 END,
    points = points + CASE WHEN _kind='xp' THEN amt ELSE 0 END,
    power_up_5050 = power_up_5050 + CASE WHEN _kind='power_5050' THEN amt ELSE 0 END,
    xp_multiplier_remaining = xp_multiplier_remaining + CASE WHEN _kind='xp_mul' THEN amt ELSE 0 END,
    coin_multiplier_remaining = coin_multiplier_remaining + CASE WHEN _kind='coin_mul' THEN amt ELSE 0 END,
    wheel_spins = wheel_spins + CASE WHEN _kind='wheel_spin' THEN amt ELSE 0 END,
    owned_skins = CASE WHEN _kind='skin' AND NOT (_skin_id = ANY (coalesce(owned_skins,'{}')))
                       THEN array_append(coalesce(owned_skins,'{}'), _skin_id) ELSE owned_skins END,
    pass_claims_free = CASE WHEN _track='free' THEN array_append(coalesce(pass_claims_free,'{}'), _tier) ELSE pass_claims_free END,
    pass_claims_plus = CASE WHEN _track='plus' THEN array_append(coalesce(pass_claims_plus,'{}'), _tier) ELSE pass_claims_plus END,
    pass_claims_pro  = CASE WHEN _track='pro'  THEN array_append(coalesce(pass_claims_pro,'{}'), _tier) ELSE pass_claims_pro END
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.grant_pass_daily_perk()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid();
  IF NOT FOUND OR NOT (p.pass_plus OR p.pass_pro) THEN RETURN jsonb_build_object('ok', false); END IF;
  IF p.last_perk_grant_date = current_date THEN RETURN jsonb_build_object('ok', false); END IF;
  PERFORM public.economy_open();
  UPDATE public.profiles SET wheel_spins = wheel_spins + 1, last_perk_grant_date = current_date
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.claim_daily_quest(_quest_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q public.daily_quests; seed integer; kind integer; c integer := 0; d integer := 0; w integer := 0; xp integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO q FROM public.daily_quests WHERE id = _quest_id AND user_id = auth.uid();
  IF NOT FOUND OR NOT q.completed OR q.claimed THEN RETURN jsonb_build_object('error','not_claimable'); END IF;
  xp := least(greatest(coalesce(q.bonus_xp,0),0), 500);
  seed := ascii(substr(q.id::text,1,1)) + ascii(substr(q.id::text, length(q.id::text), 1));
  kind := seed % 3;
  IF kind = 0 THEN c := 30 + (seed % 70);
  ELSIF kind = 1 THEN d := 1 + (seed % 3);
  ELSE w := 1; END IF;

  UPDATE public.daily_quests SET claimed = true WHERE id = q.id AND claimed = false;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_claimable'); END IF;

  PERFORM public.economy_open();
  UPDATE public.profiles SET
    points = points + xp,
    daily_xp = CASE WHEN last_xp_date IS DISTINCT FROM current_date THEN xp ELSE daily_xp + xp END,
    last_xp_date = current_date,
    coins = coins + c, diamonds = diamonds + d, wheel_spins = wheel_spins + w
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('xp', xp, 'coins', c, 'diamonds', d, 'wheel_spin', w);
END; $$;

CREATE OR REPLACE FUNCTION public.claim_mail_reward(_mail_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.system_mail; c integer; d integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO m FROM public.system_mail WHERE id = _mail_id AND recipient_id = auth.uid();
  IF NOT FOUND OR m.kind <> 'reward' THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF coalesce((m.meta->>'claimed')::boolean, false) THEN RETURN jsonb_build_object('error','already_claimed'); END IF;
  -- Only mail actually sent by an admin can be cashed in
  IF m.sender_id IS NULL OR NOT public.has_role(m.sender_id, 'admin') THEN
    RETURN jsonb_build_object('error','not_authorized');
  END IF;
  c := least(greatest(coalesce((m.meta->>'coins')::integer, 0), 0), 100000);
  d := least(greatest(coalesce((m.meta->>'diamonds')::integer, 0), 0), 10000);

  UPDATE public.system_mail
     SET meta = coalesce(meta,'{}'::jsonb) || jsonb_build_object('claimed', true), read_at = now()
   WHERE id = m.id AND coalesce((meta->>'claimed')::boolean,false) = false;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','already_claimed'); END IF;

  PERFORM public.economy_open();
  UPDATE public.profiles SET coins = coins + c, diamonds = diamonds + d WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coins', c, 'diamonds', d);
END; $$;

-- ============ 3. SYSTEM MAIL policy ============
DROP POLICY IF EXISTS "Send system mail" ON public.system_mail;
CREATE POLICY "Admins and teachers send mail"
ON public.system_mail FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'teacher') AND sender_id = auth.uid())
);

-- ============ 4. USER ROLES: no self-claim ============
DROP POLICY IF EXISTS "Users can self-claim teacher role" ON public.user_roles;
CREATE POLICY "Admins manage roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_teacher_role(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _code IS DISTINCT FROM '8080' THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'teacher')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END; $$;

-- ============ 5. CLASSES: hide join codes ============
DROP POLICY IF EXISTS "Authenticated can lookup classes" ON public.classes;
CREATE POLICY "Members and teachers view classes"
ON public.classes FOR SELECT TO authenticated
USING (teacher_id = auth.uid() OR public.is_class_member(id, auth.uid()));

CREATE OR REPLACE FUNCTION public.join_class_by_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.classes;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO c FROM public.classes WHERE class_code = upper(trim(coalesce(_code,'')));
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF c.teacher_id = auth.uid() THEN RETURN jsonb_build_object('error','own_class'); END IF;
  INSERT INTO public.class_members (class_id, student_id) VALUES (c.id, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'class_id', c.id, 'name', c.name);
END; $$;

-- ============ 6. DUELS ============
DROP POLICY IF EXISTS "Anyone authenticated can view duels" ON public.duels;
CREATE POLICY "Participants view their duels"
ON public.duels FOR SELECT TO authenticated
USING (auth.uid() = host_id OR auth.uid() = guest_id);

DROP POLICY IF EXISTS "Players update their duel" ON public.duels;
CREATE POLICY "Participants update their duel"
ON public.duels FOR UPDATE TO authenticated
USING (auth.uid() = host_id OR auth.uid() = guest_id)
WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE OR REPLACE FUNCTION public.guard_duel_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(current_setting('app.duel_ok', true),'') = '1' THEN RETURN NEW; END IF;
  NEW.id := OLD.id;
  NEW.code := OLD.code;
  NEW.host_id := OLD.host_id;
  NEW.questions := OLD.questions;
  NEW.created_at := OLD.created_at;
  IF OLD.guest_id IS NOT NULL THEN NEW.guest_id := OLD.guest_id; END IF;
  -- scores may only stay or grow by one per update
  IF NEW.host_score < OLD.host_score OR NEW.host_score > OLD.host_score + 1 THEN NEW.host_score := OLD.host_score; END IF;
  IF NEW.guest_score < OLD.guest_score OR NEW.guest_score > OLD.guest_score + 1 THEN NEW.guest_score := OLD.guest_score; END IF;
  IF NEW.current_question < OLD.current_question OR NEW.current_question > OLD.current_question + 1 THEN
    NEW.current_question := OLD.current_question;
  END IF;
  -- a player may only set their own answer
  IF auth.uid() = OLD.host_id AND NEW.guest_answer IS DISTINCT FROM OLD.guest_answer
     AND NEW.guest_answer IS NOT NULL THEN NEW.guest_answer := OLD.guest_answer; END IF;
  IF auth.uid() = OLD.guest_id AND NEW.host_answer IS DISTINCT FROM OLD.host_answer
     AND NEW.host_answer IS NOT NULL THEN NEW.host_answer := OLD.host_answer; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_duel_update ON public.duels;
CREATE TRIGGER guard_duel_update
BEFORE UPDATE ON public.duels
FOR EACH ROW EXECUTE FUNCTION public.guard_duel_update();

CREATE OR REPLACE FUNCTION public.join_duel_by_code(_code text)
RETURNS SETOF public.duels LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.duels;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO d FROM public.duels WHERE code = upper(trim(coalesce(_code,'')));
  IF NOT FOUND THEN RETURN; END IF;
  IF d.host_id = auth.uid() OR d.guest_id = auth.uid() THEN
    RETURN QUERY SELECT * FROM public.duels WHERE id = d.id;
    RETURN;
  END IF;
  IF d.guest_id IS NOT NULL THEN RAISE EXCEPTION 'duel_full'; END IF;
  PERFORM set_config('app.duel_ok','1',true);
  RETURN QUERY UPDATE public.duels SET guest_id = auth.uid(), status = 'playing'
    WHERE id = d.id AND guest_id IS NULL RETURNING *;
END; $$;

-- ============ 7. ASSIGNMENT SUBMISSIONS: server-side scoring ============
DROP POLICY IF EXISTS "Student inserts own submission" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Student updates own submission" ON public.assignment_submissions;

CREATE OR REPLACE FUNCTION public.submit_assignment(_assignment_id uuid, _details jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.assignments; sc integer; tot integer; ids integer[];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO a FROM public.assignments WHERE id = _assignment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'assignment_not_found'; END IF;
  IF NOT public.is_class_member(a.class_id, auth.uid()) THEN RAISE EXCEPTION 'not_a_class_member'; END IF;
  IF EXISTS (SELECT 1 FROM public.assignment_submissions
             WHERE assignment_id = a.id AND student_id = auth.uid()) THEN
    RETURN jsonb_build_object('error','already_submitted');
  END IF;
  IF jsonb_typeof(_details) <> 'array' THEN RAISE EXCEPTION 'invalid_details'; END IF;

  SELECT array_agg(DISTINCT (e->>'word_id')::integer) INTO ids
  FROM jsonb_array_elements(_details) e;

  -- every answered word must belong to the assignment, and each only once
  IF ids IS NULL
     OR EXISTS (SELECT 1 FROM unnest(ids) x WHERE NOT (x = ANY (a.word_ids)))
     OR array_length(ids,1) <> jsonb_array_length(_details) THEN
    RAISE EXCEPTION 'invalid_details';
  END IF;

  tot := array_length(a.word_ids, 1);
  SELECT count(*) INTO sc FROM jsonb_array_elements(_details) e
   WHERE coalesce((e->>'correct')::boolean, false);
  sc := least(sc, tot);

  INSERT INTO public.assignment_submissions (assignment_id, student_id, score, total, details)
  VALUES (a.id, auth.uid(), sc, tot, _details);

  RETURN jsonb_build_object('score', sc, 'total', tot);
END; $$;

-- ============ 8. Function execute privileges ============
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_economy() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_duel_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.economy_open() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_class_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_class_teacher(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_school_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_teacher(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid, uuid) TO authenticated;

DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'add_points(integer)','award_quiz_rewards(integer)','update_quiz_streak()','sync_words_mastered()',
    'purchase_shop_item(text)','use_power_up_5050()','exchange_currency(text,integer)','spin_wheel()',
    'buy_skin(text)','buy_pass(text)','claim_pass_reward(text,integer,text,integer,text)',
    'grant_pass_daily_perk()','claim_daily_quest(uuid)','claim_mail_reward(uuid)',
    'claim_teacher_role(text)','join_class_by_code(text)','join_duel_by_code(text)',
    'submit_assignment(uuid,jsonb)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated;', fn);
  END LOOP;
END $$;