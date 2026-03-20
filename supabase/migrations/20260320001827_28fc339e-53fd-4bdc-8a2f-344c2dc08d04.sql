ALTER TABLE public.study_rooms ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
ALTER TABLE public.study_rooms ADD COLUMN IF NOT EXISTS room_code text UNIQUE;