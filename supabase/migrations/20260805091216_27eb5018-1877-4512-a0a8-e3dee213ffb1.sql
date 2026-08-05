-- 1. Seed school spaces
INSERT INTO public.schools (name, school_code)
SELECT v.name, v.code FROM (VALUES
  ('בית ספר רמב"ם','5060'),
  ('בית ספר וולפסון','8585'),
  ('בית ספר לישנא','8080')
) AS v(name, code)
WHERE NOT EXISTS (SELECT 1 FROM public.schools s WHERE s.school_code = v.code);

-- 2. Migrate legacy classes into "בית ספר לישנא"
UPDATE public.classes
   SET school_id = (SELECT id FROM public.schools WHERE school_code = '8080' LIMIT 1)
 WHERE school_id IS NULL;

-- 3. New columns
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'vocab',
  ADD COLUMN IF NOT EXISTS questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source jsonb;

ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- 4. Staff helper: teacher of the class OR a teacher registered in the class's school
CREATE OR REPLACE FUNCTION public.is_class_staff(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = _class_id
      AND (c.teacher_id = _user_id
           OR (c.school_id IS NOT NULL AND EXISTS (
                 SELECT 1 FROM public.school_members sm
                 WHERE sm.school_id = c.school_id AND sm.user_id = _user_id)))
  )
$$;
REVOKE ALL ON FUNCTION public.is_class_staff(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_class_staff(uuid, uuid) TO authenticated, service_role;

-- 5. Limits: max 4 classes per school, max 30 students per class
CREATE OR REPLACE FUNCTION public.enforce_class_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.school_id IS NULL THEN RAISE EXCEPTION 'school_required'; END IF;
  IF (SELECT count(*) FROM public.classes WHERE school_id = NEW.school_id) >= 4 THEN
    RAISE EXCEPTION 'class_limit_reached';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_class_limits ON public.classes;
CREATE TRIGGER enforce_class_limits BEFORE INSERT ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.enforce_class_limits();

CREATE OR REPLACE FUNCTION public.enforce_class_member_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.class_members WHERE class_id = NEW.class_id) >= 30 THEN
    RAISE EXCEPTION 'student_limit_reached';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_class_member_limit ON public.class_members;
CREATE TRIGGER enforce_class_member_limit BEFORE INSERT ON public.class_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_class_member_limit();

-- 6. Shared school-space access policies
DROP POLICY IF EXISTS "Teachers update their own classes" ON public.classes;
CREATE POLICY "School staff update classes" ON public.classes
FOR UPDATE TO authenticated USING (public.is_class_staff(id, auth.uid()));

DROP POLICY IF EXISTS "Teachers delete their own classes" ON public.classes;
CREATE POLICY "School staff delete classes" ON public.classes
FOR DELETE TO authenticated USING (public.is_class_staff(id, auth.uid()));

DROP POLICY IF EXISTS "Teachers create their own classes" ON public.classes;
CREATE POLICY "School members create classes" ON public.classes
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = teacher_id
  AND school_id IS NOT NULL
  AND public.is_school_member(school_id, auth.uid())
);

DROP POLICY IF EXISTS "Teachers view members of their classes" ON public.class_members;
CREATE POLICY "School staff view class members" ON public.class_members
FOR SELECT TO authenticated USING (public.is_class_staff(class_id, auth.uid()));

DROP POLICY IF EXISTS "Students or teacher remove membership" ON public.class_members;
CREATE POLICY "Student or staff remove membership" ON public.class_members
FOR DELETE TO authenticated USING (auth.uid() = student_id OR public.is_class_staff(class_id, auth.uid()));

DROP POLICY IF EXISTS "Teacher manages own assignments" ON public.assignments;
CREATE POLICY "School staff manage assignments" ON public.assignments
FOR ALL TO authenticated
USING (public.is_class_staff(class_id, auth.uid()))
WITH CHECK (auth.uid() = teacher_id AND public.is_class_staff(class_id, auth.uid()));

DROP POLICY IF EXISTS "Teacher views submissions for their class" ON public.assignment_submissions;
CREATE POLICY "School staff view submissions" ON public.assignment_submissions
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assignments a
          WHERE a.id = assignment_submissions.assignment_id
            AND public.is_class_staff(a.class_id, auth.uid()))
);

DROP POLICY IF EXISTS "Teacher sends class mail" ON public.class_mail;
CREATE POLICY "School staff send class mail" ON public.class_mail
FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id AND public.is_class_staff(class_id, auth.uid()));

DROP POLICY IF EXISTS "Members read class mail" ON public.class_mail;
CREATE POLICY "Members and staff read class mail" ON public.class_mail
FOR SELECT TO authenticated USING (public.is_class_member(class_id, auth.uid()) OR public.is_class_staff(class_id, auth.uid()));

DROP POLICY IF EXISTS "Members view class assignments" ON public.assignments;
CREATE POLICY "Members view class assignments" ON public.assignments
FOR SELECT TO authenticated USING (public.is_class_member(class_id, auth.uid()) OR public.is_class_staff(class_id, auth.uid()));

-- 7. Join a school space with its code (also grants the teacher role)
CREATE OR REPLACE FUNCTION public.join_school_by_code(_code text, _name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.schools; nm text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO s FROM public.schools WHERE school_code = trim(coalesce(_code,''));
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;

  INSERT INTO public.school_members (school_id, user_id)
  VALUES (s.id, auth.uid()) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'teacher') ON CONFLICT (user_id, role) DO NOTHING;

  nm := nullif(btrim(coalesce(_name,'')), '');
  IF nm IS NOT NULL THEN
    UPDATE public.profiles SET display_name = left(nm, 60) WHERE user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', s.id, 'name', s.name, 'code', s.school_code);
END; $$;
REVOKE ALL ON FUNCTION public.join_school_by_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_school_by_code(text, text) TO authenticated;

-- 8. Submission with duration + support for gemara question quizzes
DROP FUNCTION IF EXISTS public.submit_assignment(uuid, jsonb);
CREATE OR REPLACE FUNCTION public.submit_assignment(_assignment_id uuid, _details jsonb, _duration_seconds integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.assignments; sc integer; tot integer; ids integer[]; dur integer;
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

  dur := least(greatest(coalesce(_duration_seconds, 0), 0), 86400);

  IF a.mode = 'gemara' THEN
    tot := jsonb_array_length(coalesce(a.questions, '[]'::jsonb));
    SELECT array_agg(DISTINCT (e->>'question_index')::integer) INTO ids
      FROM jsonb_array_elements(_details) e;
    IF tot = 0 OR ids IS NULL
       OR EXISTS (SELECT 1 FROM unnest(ids) x WHERE x < 0 OR x >= tot)
       OR array_length(ids,1) <> jsonb_array_length(_details) THEN
      RAISE EXCEPTION 'invalid_details';
    END IF;
  ELSE
    tot := array_length(a.word_ids, 1);
    SELECT array_agg(DISTINCT (e->>'word_id')::integer) INTO ids
      FROM jsonb_array_elements(_details) e;
    IF ids IS NULL
       OR EXISTS (SELECT 1 FROM unnest(ids) x WHERE NOT (x = ANY (a.word_ids)))
       OR array_length(ids,1) <> jsonb_array_length(_details) THEN
      RAISE EXCEPTION 'invalid_details';
    END IF;
  END IF;

  SELECT count(*) INTO sc FROM jsonb_array_elements(_details) e
   WHERE coalesce((e->>'correct')::boolean, false);
  sc := least(sc, tot);

  INSERT INTO public.assignment_submissions (assignment_id, student_id, score, total, details, duration_seconds)
  VALUES (a.id, auth.uid(), sc, tot, _details, dur);

  RETURN jsonb_build_object('score', sc, 'total', tot);
END; $$;
REVOKE ALL ON FUNCTION public.submit_assignment(uuid, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_assignment(uuid, jsonb, integer) TO authenticated;