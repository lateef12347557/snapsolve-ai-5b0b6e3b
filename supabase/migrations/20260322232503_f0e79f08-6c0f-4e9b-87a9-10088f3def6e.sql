DROP POLICY IF EXISTS "Anyone can delete rooms" ON public.study_rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.study_rooms;

CREATE POLICY "Owner can delete rooms" ON public.study_rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can update rooms" ON public.study_rooms
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);