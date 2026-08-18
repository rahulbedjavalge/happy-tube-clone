# Uploads, Shorts, and Channel Settings

Adds real file uploads (max 10 minutes per video), a Shorts section for vertical short-form clips, and a fuller channel settings area.

## Video upload (10 min limit)

- In Creator Studio, a new upload flow: pick a video file, it plays in a hidden element first so the browser reads its real duration.
  - Longer than 10:00 → rejected with a clear message, nothing uploads.
  - Shorter than 60s and portrait → auto-marked as a Short (user can toggle).
- File goes to a private storage bucket (`media`) under `userId/...`; playback uses signed URLs, refreshed on demand. Public buckets are blocked on this workspace, so signed URLs are the way.
- Optional thumbnail image upload to the same bucket; if none is given, a frame is captured from the video at ~1s and uploaded as the thumbnail.
- Upload progress bar, cancel, and validation for size/type (mp4/webm/mov, images jpg/png/webp).
- Pasting an external video URL stays supported as an alternative.

## Shorts

- Videos get `is_short` (and `duration_seconds` <= 60 enforced for shorts).
- New `/shorts` route: full-height vertical feed, one Short per screen, snap-scroll, autoplay muted with tap-to-unmute, like/comment/subscribe rail on the right, keyboard/scroll navigation.
- Shorts row on the home feed (horizontal scroller with vertical thumbnails), and a Shorts tab on channel pages.
- Shorts are excluded from the main home grid so the two feeds stay distinct.

## Channel settings

Moves from the current two inline fields to a dedicated settings section in Studio:

- Avatar and banner image upload (with preview), display name, handle (unique, validated, lowercase), description/about text, links.
- Handle change updates the public `/channel/$handle` URL.
- Channel page gains: banner, avatar, subscriber count, Videos / Shorts / About tabs with the about text and join date.

## Technical notes

- Storage: private bucket `media` created via the storage tool, with RLS on `storage.objects` — owners can insert/update/delete under their own `userId/` prefix; reads go through short-lived signed URLs generated client-side by the owner or via a public server function for public videos.
- Migration: add `is_short boolean not null default false`, `links jsonb`, and a trigger validating `duration_seconds <= 600` (and `<= 60` when `is_short`); index on `(is_short, created_at)`.
- Profiles: enforce unique lowercase handle with a check + unique index; update-own policy already exists.
- Queries in `src/lib/queries.ts` gain `fetchShorts`, `is_short` filtering on existing feeds, storage upload helpers, and signed-URL resolution.
- New files: `src/routes/shorts.tsx`, `src/components/UploadDialog.tsx`, `src/components/ShortsPlayer.tsx`, `src/lib/storage.ts`; Studio and channel page updated.
- Each new route gets its own SEO `head()`.
