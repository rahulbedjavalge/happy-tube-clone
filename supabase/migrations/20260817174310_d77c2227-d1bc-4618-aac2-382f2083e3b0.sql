-- PROFILES (channels)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_url text,
  banner_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- VIDEOS
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text NOT NULL,
  thumbnail_url text,
  category text NOT NULL DEFAULT 'All',
  duration_seconds integer NOT NULL DEFAULT 0,
  views bigint NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX videos_owner_idx ON public.videos(owner_id);
CREATE INDEX videos_created_idx ON public.videos(created_at DESC);
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_public_read" ON public.videos FOR SELECT USING (is_public OR owner_id = auth.uid());
CREATE POLICY "videos_insert_own" ON public.videos FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "videos_update_own" ON public.videos FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "videos_delete_own" ON public.videos FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscriber_id, channel_id)
);
GRANT SELECT ON public.subscriptions TO anon;
GRANT SELECT, INSERT, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_public_read" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "subs_insert_own" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (subscriber_id = auth.uid());
CREATE POLICY "subs_delete_own" ON public.subscriptions FOR DELETE TO authenticated USING (subscriber_id = auth.uid());

-- COMMENTS
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_video_idx ON public.comments(video_id, created_at DESC);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid());

-- LIKES
CREATE TABLE public.video_likes (
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
GRANT SELECT ON public.video_likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_public_read" ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "likes_write_own" ON public.video_likes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND value IN (-1, 1));

-- WATCH HISTORY
CREATE TABLE public.watch_history (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_history TO authenticated;
GRANT ALL ON public.watch_history TO service_role;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_own" ON public.watch_history FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  n int := 0;
BEGIN
  base_handle := lower(regexp_replace(split_part(coalesce(NEW.email, 'user'), '@', 1), '[^a-z0-9]', '', 'g'));
  IF base_handle = '' THEN base_handle := 'user'; END IF;
  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE p.handle = final_handle) LOOP
    n := n + 1;
    final_handle := base_handle || n::text;
  END LOOP;

  INSERT INTO public.profiles (id, handle, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_handle,
    coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', base_handle),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VIEW COUNTER
CREATE OR REPLACE FUNCTION public.increment_video_views(_video_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.videos SET views = views + 1 WHERE id = _video_id AND is_public;
$$;
GRANT EXECUTE ON FUNCTION public.increment_video_views(uuid) TO anon, authenticated;

-- DEMO CHANNELS
INSERT INTO public.profiles (id, handle, display_name, avatar_url, banner_url, description) VALUES
  ('11111111-1111-4111-8111-111111111111', 'blenderstudio', 'Blender Studio', 'https://api.dicebear.com/7.x/shapes/svg?seed=blender', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=70', 'Open movie shorts and animation experiments.'),
  ('22222222-2222-4222-8222-222222222222', 'chromecasts', 'Chrome Casts', 'https://api.dicebear.com/7.x/shapes/svg?seed=chrome', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70', 'Demo reels, tech showcases and product films.'),
  ('33333333-3333-4333-8333-333333333333', 'wildframe', 'WildFrame', 'https://api.dicebear.com/7.x/shapes/svg?seed=wild', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=70', 'Nature, escapes and slow cinema.'),
  ('44444444-4444-4444-8444-444444444444', 'loopmotion', 'Loop Motion', 'https://api.dicebear.com/7.x/shapes/svg?seed=loop', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=70', 'Motion design, music and visual loops.');

-- DEMO VIDEOS
INSERT INTO public.videos (owner_id, title, description, video_url, thumbnail_url, category, duration_seconds, views, created_at) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Big Buck Bunny — Full Short Film', 'A giant rabbit with a heart bigger than himself. Classic open movie by the Blender Foundation.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', 'Animation', 596, 1284322, now() - interval '40 days'),
  ('11111111-1111-4111-8111-111111111111', 'Elephants Dream — The First Open Movie', 'Surreal animated short exploring a strange mechanical world.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', 'Animation', 653, 842190, now() - interval '80 days'),
  ('11111111-1111-4111-8111-111111111111', 'Sintel — Epic Fantasy Short', 'A lonely girl searches for her lost dragon companion.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', 'Animation', 888, 2310884, now() - interval '12 days'),
  ('11111111-1111-4111-8111-111111111111', 'Tears of Steel — Sci-Fi VFX Short', 'Live action meets CGI in this futuristic Amsterdam story.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg', 'Film', 734, 655120, now() - interval '5 days'),
  ('22222222-2222-4222-8222-222222222222', 'For Bigger Blazes', 'A short showcase of casting video to the big screen.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', 'Tech', 15, 98211, now() - interval '2 days'),
  ('22222222-2222-4222-8222-222222222222', 'For Bigger Escape', 'When your living room becomes the cinema.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg', 'Tech', 15, 143908, now() - interval '9 days'),
  ('22222222-2222-4222-8222-222222222222', 'For Bigger Fun', 'A tiny film about bigger fun on a bigger screen.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg', 'Tech', 60, 57231, now() - interval '20 days'),
  ('22222222-2222-4222-8222-222222222222', 'For Bigger Joyrides', 'Take the drive to the living room screen.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg', 'Tech', 15, 210773, now() - interval '1 day'),
  ('33333333-3333-4333-8333-333333333333', 'Subaru Outback — On The Street And Dirt', 'A drive through streets and trails, shot on location.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg', 'Travel', 594, 320559, now() - interval '30 days'),
  ('33333333-3333-4333-8333-333333333333', 'Volkswagen GTI Review', 'A hands-on look at a hot hatch icon.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/VolkswagenGTIReview.jpg', 'Travel', 653, 89012, now() - interval '3 days'),
  ('44444444-4444-4444-8444-444444444444', 'We Are Going On Bullrun', 'A road trip cut with music and motion.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg', 'Music', 47, 401238, now() - interval '15 days'),
  ('44444444-4444-4444-8444-444444444444', 'What Car Can You Get For A Grand?', 'A budget challenge, four wheels at a time.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg', 'Gaming', 147, 73320, now() - interval '6 days');

-- DEMO COMMENTS
INSERT INTO public.comments (video_id, author_id, body, created_at)
SELECT v.id, '22222222-2222-4222-8222-222222222222', 'Still one of the best shorts ever made.', now() - interval '2 days'
FROM public.videos v WHERE v.title LIKE 'Big Buck Bunny%';
INSERT INTO public.comments (video_id, author_id, body, created_at)
SELECT v.id, '33333333-3333-4333-8333-333333333333', 'The lighting in this is unreal.', now() - interval '1 day'
FROM public.videos v WHERE v.title LIKE 'Sintel%';