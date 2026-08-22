
UPDATE public.videos SET
  title = 'Jellyfish drift like they have nowhere to be',
  description = 'Ten seconds of pure calm. Watch how they pulse without ever seeming to try.',
  thumbnail_url = 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?w=540&h=960&fit=crop&q=80',
  views = 184203, category = 'Nature'
WHERE id = '263e69f5-f591-4e6d-b46b-1ab3f4f0544d';

UPDATE public.videos SET
  title = 'A flower opening, sped up 400x',
  description = 'Something you would never notice in real time.',
  thumbnail_url = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=540&h=960&fit=crop&q=80',
  views = 92551, category = 'Nature'
WHERE id = '0ec6727d-a66a-4bd9-94fe-6b66593c5341';

UPDATE public.videos SET
  title = 'The bunny that started every video test ever',
  description = 'If you have watched a demo player, you have met this rabbit.',
  thumbnail_url = 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=540&h=960&fit=crop&q=80',
  views = 331984, category = 'Animation'
WHERE id = '68cd89c4-2d53-49b7-93e1-98d6d9dcac05';

INSERT INTO public.videos (owner_id, title, description, video_url, thumbnail_url, category, duration_seconds, views, is_public, is_short, created_at) VALUES
('33333333-3333-4333-8333-333333333333','Why do jellyfish glow in the dark?','Bioluminescence is a chemical reaction, not a light bulb. Wild.','https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4','https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=540&h=960&fit=crop&q=80','Nature',10,412870,true,true, now() - interval '1 hour'),
('33333333-3333-4333-8333-333333333333','This tiny ocean drifter has no brain at all','No heart, no bones, no brain. Still older than trees.','https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4','https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=540&h=960&fit=crop&q=80','Nature',10,238119,true,true, now() - interval '3 hours'),
('33333333-3333-4333-8333-333333333333','Slow motion water is weirdly satisfying','Turn the sound on for this one.','https://download.samplelib.com/mp4/sample-5s.mp4','https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=540&h=960&fit=crop&q=80','Nature',5,157432,true,true, now() - interval '6 hours'),
('11111111-1111-4111-8111-111111111111','The rabbit prank that never gets old','Big Buck Bunny plotting revenge in under 10 seconds.','https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4','https://images.unsplash.com/photo-1535241749838-299277b6305f?w=540&h=960&fit=crop&q=80','Animation',10,528340,true,true, now() - interval '9 hours'),
('11111111-1111-4111-8111-111111111111','Animated in a bedroom, screened in cinemas','Open source animation went further than anyone expected.','https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4','https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=540&h=960&fit=crop&q=80','Animation',10,201558,true,true, now() - interval '12 hours'),
('11111111-1111-4111-8111-111111111111','10 seconds of dragon, 3 years of work','The render farm ran for months for shots like this.','https://media.w3.org/2010/05/sintel/trailer.mp4','https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=540&h=960&fit=crop&q=80','Animation',52,177204,true,true, now() - interval '15 hours'),
('44444444-4444-4444-8444-444444444444','Loop this and try to find the cut','We hid the seam. Good luck.','https://download.samplelib.com/mp4/sample-10s.mp4','https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=540&h=960&fit=crop&q=80','Music',10,143998,true,true, now() - interval '19 hours'),
('44444444-4444-4444-8444-444444444444','A city block in 15 seconds','Everything moves. Nobody looks up.','https://filesamples.com/samples/video/mp4/sample_640x360.mp4','https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=540&h=960&fit=crop&q=80','Travel',13,98120,true,true, now() - interval '22 hours'),
('44444444-4444-4444-8444-444444444444','Colour test footage that became art','Made to check monitors. Ended up oddly beautiful.','https://media.w3.org/2010/05/video/movie_300.mp4','https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=540&h=960&fit=crop&q=80','Film',6,74310,true,true, now() - interval '26 hours'),
('22222222-2222-4222-8222-222222222222','Time-lapse: petals do this all night','You sleep through the best part of a flower''s day.','https://mdn.github.io/shared-assets/videos/flower.mp4','https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=540&h=960&fit=crop&q=80','Nature',7,266741,true,true, now() - interval '30 hours'),
('22222222-2222-4222-8222-222222222222','The most-played 30 seconds on the internet','Every developer has watched this clip at least once.','https://mdn.github.io/shared-assets/videos/friday.mp4','https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=540&h=960&fit=crop&q=80','Tech',35,311502,true,true, now() - interval '34 hours'),
('22222222-2222-4222-8222-222222222222','Curious fact: video is just still images lying to you','24 pictures a second and your brain fills the rest.','https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4','https://images.unsplash.com/photo-1485846234645-a62644f84728?w=540&h=960&fit=crop&q=80','Tech',10,189677,true,true, now() - interval '38 hours'),
('33333333-3333-4333-8333-333333333333','Sunset drift, no filter needed','Shot straight out of camera.','https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4','https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=540&h=960&fit=crop&q=80','Travel',10,120845,true,true, now() - interval '42 hours');
