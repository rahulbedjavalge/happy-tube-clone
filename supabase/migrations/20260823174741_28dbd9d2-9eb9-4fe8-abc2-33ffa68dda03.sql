
UPDATE public.videos SET duration_seconds = 600 WHERE duration_seconds > 600;
UPDATE public.videos SET duration_seconds = 15 WHERE is_short AND duration_seconds > 60;

UPDATE public.videos SET views = 0 WHERE views <> 0;
UPDATE public.videos v SET views = sub.c FROM (
  SELECT video_id, count(*)::bigint AS c FROM public.watch_history GROUP BY video_id
) sub WHERE sub.video_id = v.id AND v.views <> sub.c;

ALTER TABLE public.comments ALTER COLUMN approved SET DEFAULT true;
UPDATE public.comments SET approved = true WHERE approved = false;

UPDATE public.videos SET video_url = 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4', duration_seconds = 10
  WHERE is_short AND video_url = 'https://media.w3.org/2010/05/sintel/trailer.mp4';
UPDATE public.videos SET video_url = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', duration_seconds = 10
  WHERE is_short AND video_url IN ('https://media.w3.org/2010/05/video/movie_300.mp4','https://media.w3.org/2010/05/bunny/trailer.mp4','https://media.w3.org/2010/05/bunny/movie.mp4');
UPDATE public.videos SET video_url = 'https://download.samplelib.com/mp4/sample-10s.mp4', duration_seconds = 10
  WHERE is_short AND video_url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
