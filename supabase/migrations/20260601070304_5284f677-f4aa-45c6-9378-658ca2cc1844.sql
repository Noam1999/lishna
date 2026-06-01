
-- Ensure handle_new_user trigger exists & is resilient
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow users to self-assign teacher role (admins assigned via service role / SQL)
DROP POLICY IF EXISTS "Users can self-claim teacher role" ON public.user_roles;
CREATE POLICY "Users can self-claim teacher role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'teacher'::app_role);

-- Seed school 8080 if missing
INSERT INTO public.schools (name, school_code)
SELECT 'בית אוהל שלמה', '8080'
WHERE NOT EXISTS (SELECT 1 FROM public.schools WHERE school_code = '8080');

-- Enable realtime on messaging tables
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.system_mail REPLICA IDENTITY FULL;
ALTER TABLE public.class_mail REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='direct_messages';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='system_mail';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.system_mail; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='class_mail';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.class_mail; END IF;
END $$;
