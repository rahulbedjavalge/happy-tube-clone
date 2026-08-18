ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_short boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_video_duration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.duration_seconds > 600 THEN
    RAISE EXCEPTION 'Videos can be at most 10 minutes long';
  END IF;
  IF NEW.is_short AND NEW.duration_seconds > 60 THEN
    RAISE EXCEPTION 'Shorts can be at most 60 seconds long';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_video_duration_trg ON public.videos;
CREATE TRIGGER validate_video_duration_trg
BEFORE INSERT OR UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.validate_video_duration();

CREATE INDEX IF NOT EXISTS videos_short_created_idx ON public.videos (is_short, created_at DESC);

DROP POLICY IF EXISTS "media_read_all" ON storage.objects;
CREATE POLICY "media_read_all" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_insert_own" ON storage.objects;
CREATE POLICY "media_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "media_update_own" ON storage.objects;
CREATE POLICY "media_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "media_delete_own" ON storage.objects;
CREATE POLICY "media_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);