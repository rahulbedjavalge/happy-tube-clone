# YouTube Clone — Full Platform

A YouTube-style video platform with accounts, channels, uploads, subscriptions, comments, likes, and search. Video content comes from sample/stock video URLs, and users can also add their own videos by URL.

## Backend (Lovable Cloud)

Enable Lovable Cloud for database, auth, and storage.

Tables:
- `profiles` — user id, display name, avatar, channel handle, banner, description
- `videos` — title, description, video_url, thumbnail_url, owner, views, duration, created_at, visibility
- `subscriptions` — subscriber + channel pair
- `comments` — video, author, body, created_at
- `video_likes` — video, user, value (like/dislike)
- `watch_history` — user, video, watched_at

Every table gets grants + row-level security: public read on public videos, profiles, comments; writes limited to the owner. A signup trigger creates the profile row. A seed migration inserts ~12 demo videos with stock video URLs and thumbnails so the home feed is full immediately.

Storage bucket for user-uploaded thumbnails and avatars; video files can be uploaded to storage too, with a URL option as fallback.

## Pages

- `/` — home feed: category chips, responsive grid of video cards (thumbnail, duration badge, title, channel, views, age)
- `/watch/$id` — player, title, like/dislike, subscribe button, description panel, comments thread, "up next" sidebar
- `/results` — search results list with filters by newest/most viewed
- `/channel/$handle` — banner, avatar, subscribe, tabs for Videos / About
- `/studio` — signed-in creator area: upload/edit/delete videos
- `/subscriptions`, `/history`, `/liked` — signed-in feeds
- `/auth` — email/password sign in and sign up

## Shell and design

YouTube-like layout: top bar with logo, centered search, avatar menu; collapsible left sidebar with Home, Subscriptions, History, Liked, Your channel. Dark mode default with light mode toggle, red accent, rounded thumbnails, skeleton loaders. All colors as semantic tokens in `src/styles.css` — no hardcoded color classes.

## Technical notes

- TanStack Start file routes under `src/routes`; data loaded via route loaders + TanStack Query.
- Authenticated pages (studio, history, liked, subscriptions) live under an `_authenticated` gate.
- Views increment through a server function; likes/subscriptions toggle with optimistic updates.
- Search uses Postgres `ilike` over title/description with an index.
- Each route gets its own SEO `head()` with unique title/description/og tags.

## Build order

1. Enable Cloud, migrations + seed data
2. App shell (topbar, sidebar, theme tokens)
3. Home feed + watch page + player
4. Auth + profiles/channels + subscriptions
5. Comments, likes, history
6. Studio upload/manage, search results, polish
