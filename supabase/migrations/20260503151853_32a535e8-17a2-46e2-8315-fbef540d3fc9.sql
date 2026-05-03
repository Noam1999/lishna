
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

DROP TABLE IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.class_members CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP FUNCTION IF EXISTS public.is_class_teacher(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_class_member(uuid, uuid);

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  name text NOT NULL,
  class_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'assignment',
  word_ids integer[] NOT NULL DEFAULT '{}',
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  details jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id = _class_id AND student_id = _user_id)
$$;

-- classes policies
CREATE POLICY "Authenticated can lookup classes" ON public.classes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers create their own classes" ON public.classes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers update their own classes" ON public.classes
  FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers delete their own classes" ON public.classes
  FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- class_members policies
CREATE POLICY "Students view their own membership" ON public.class_members
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teachers view members of their classes" ON public.class_members
  FOR SELECT TO authenticated USING (public.is_class_teacher(class_id, auth.uid()));
CREATE POLICY "Students join classes" ON public.class_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students or teacher remove membership" ON public.class_members
  FOR DELETE TO authenticated USING (auth.uid() = student_id OR public.is_class_teacher(class_id, auth.uid()));

-- assignments policies
CREATE POLICY "Teacher manages own assignments" ON public.assignments
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Members view class assignments" ON public.assignments
  FOR SELECT TO authenticated USING (public.is_class_member(class_id, auth.uid()));

-- submissions policies
CREATE POLICY "Student inserts own submission" ON public.assignment_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Student updates own submission" ON public.assignment_submissions
  FOR UPDATE TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Student views own submission" ON public.assignment_submissions
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Teacher views submissions for their class" ON public.assignment_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = auth.uid())
  );
