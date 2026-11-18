DROP POLICY IF EXISTS "Users can view all season history" ON public.season_history;
CREATE POLICY "Signed-in users can view season history" ON public.season_history FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Signed-in users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all achievements" ON public.achievements;
CREATE POLICY "Signed-in users can view achievements" ON public.achievements FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all celebrations" ON public.activity_celebrations;
CREATE POLICY "Signed-in users can view celebrations" ON public.activity_celebrations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone authenticated can view schools" ON public.schools;
CREATE POLICY "Members can view their schools" ON public.schools FOR SELECT TO authenticated USING (public.is_school_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can view activities of friends" ON public.user_activities;
CREATE POLICY "Users can view own and friends activities" ON public.user_activities FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.friendships f WHERE f.status = 'accepted'
      AND ((f.user_id = auth.uid() AND f.friend_id = user_activities.user_id)
        OR (f.friend_id = auth.uid() AND f.user_id = user_activities.user_id))));

DROP POLICY IF EXISTS "Anyone can view custom words" ON public.custom_words;
CREATE POLICY "Signed-in users can view custom words" ON public.custom_words FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);