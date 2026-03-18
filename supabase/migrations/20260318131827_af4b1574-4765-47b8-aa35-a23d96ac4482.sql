
-- Study rooms table
CREATE TABLE public.study_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  created_by TEXT NOT NULL DEFAULT 'Anonymous',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study room messages table
CREATE TABLE public.study_room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for collaborative rooms)
CREATE POLICY "Anyone can view rooms" ON public.study_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.study_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.study_rooms FOR UPDATE USING (true);

CREATE POLICY "Anyone can view messages" ON public.study_room_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON public.study_room_messages FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
