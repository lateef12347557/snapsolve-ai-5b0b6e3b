-- Allow anyone to delete rooms (matching the existing public access pattern)
CREATE POLICY "Anyone can delete rooms"
ON public.study_rooms
FOR DELETE
TO public
USING (true);