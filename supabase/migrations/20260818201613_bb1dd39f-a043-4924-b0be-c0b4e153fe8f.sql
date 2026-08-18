
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
UPDATE public.comments SET approved = true WHERE approved = false;

ALTER TABLE public.watch_history ADD COLUMN IF NOT EXISTS seconds_watched integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range text;

DROP POLICY IF EXISTS comments_public_read ON public.comments;
CREATE POLICY comments_public_read ON public.comments FOR SELECT USING (
  approved
  OR author_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.videos v WHERE v.id = comments.video_id AND v.owner_id = auth.uid())
);

CREATE POLICY comments_owner_moderate ON public.comments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = comments.video_id AND v.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = comments.video_id AND v.owner_id = auth.uid()));

CREATE POLICY comments_owner_delete ON public.comments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = comments.video_id AND v.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.video_analytics(_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.videos v WHERE v.id = _video_id AND v.owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'views', (SELECT views FROM public.videos WHERE id = _video_id),
    'likes', (SELECT count(*) FROM public.video_likes WHERE video_id = _video_id AND value = 1),
    'dislikes', (SELECT count(*) FROM public.video_likes WHERE video_id = _video_id AND value = -1),
    'watch_seconds', (SELECT coalesce(sum(seconds_watched), 0) FROM public.watch_history WHERE video_id = _video_id),
    'viewers', (SELECT count(*) FROM public.watch_history WHERE video_id = _video_id),
    'countries', (
      SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT coalesce(p.country, 'Unknown') AS label, count(*)::int AS value
        FROM public.watch_history w JOIN public.profiles p ON p.id = w.user_id
        WHERE w.video_id = _video_id
        GROUP BY 1 ORDER BY 2 DESC LIMIT 8
      ) t
    ),
    'ages', (
      SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT coalesce(p.age_range, 'Unknown') AS label, count(*)::int AS value
        FROM public.watch_history w JOIN public.profiles p ON p.id = w.user_id
        WHERE w.video_id = _video_id
        GROUP BY 1 ORDER BY 2 DESC LIMIT 8
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.channel_analytics(_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF _owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'uploads', (SELECT count(*) FROM public.videos WHERE owner_id = _owner_id AND NOT is_short),
    'shorts', (SELECT count(*) FROM public.videos WHERE owner_id = _owner_id AND is_short),
    'views', (SELECT coalesce(sum(views), 0) FROM public.videos WHERE owner_id = _owner_id),
    'likes', (SELECT count(*) FROM public.video_likes l JOIN public.videos v ON v.id = l.video_id WHERE v.owner_id = _owner_id AND l.value = 1),
    'subscribers', (SELECT count(*) FROM public.subscriptions WHERE channel_id = _owner_id),
    'comments', (SELECT count(*) FROM public.comments c JOIN public.videos v ON v.id = c.video_id WHERE v.owner_id = _owner_id),
    'pending_comments', (SELECT count(*) FROM public.comments c JOIN public.videos v ON v.id = c.video_id WHERE v.owner_id = _owner_id AND NOT c.approved),
    'watch_seconds', (SELECT coalesce(sum(w.seconds_watched), 0) FROM public.watch_history w JOIN public.videos v ON v.id = w.video_id WHERE v.owner_id = _owner_id)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.video_analytics(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.channel_analytics(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.video_analytics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.channel_analytics(uuid) TO authenticated;
