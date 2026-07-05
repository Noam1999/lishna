CREATE OR REPLACE FUNCTION public.duel_answer_slot_empty()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT true
$$;