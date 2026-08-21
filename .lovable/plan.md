# More public Shorts

Right now the Shorts feed has only 3 demo clips, all on one demo channel, and all named after the old sample files ("For Bigger Joyrides", etc.). This adds a proper set of fun/curious Shorts that anyone can watch without signing in.

## What changes

- Seed roughly 12 new Shorts with playful, curiosity-style titles and descriptions (nature oddities, animals, science-y moments, quick city scenes), spread across the existing demo channels so the feed doesn't look like one account.
- Each Short: vertical-friendly stock clip URL, portrait thumbnail image, duration under 60s, `is_short = true`, `is_public = true`, and a view/like count that looks lived-in.
- Rename the 3 existing Shorts to match the new tone so the feed reads consistently.
- Verify each clip URL actually plays (no 403s) before seeding — the earlier demo set had dead Google sample links.

## Public access, no sign-in

- Confirm the Shorts feed loads for a signed-out visitor: browse, autoplay, mute/unmute, and open a specific Short via its link.
- Like and comment stay sign-in actions; signed-out visitors get a prompt instead of an error.
- Give `/shorts` proper share metadata so a linked Short previews correctly.

## Technical notes

- Data-only migration: `INSERT` statements into `videos` with literal rows (owner ids from the existing demo profiles), plus `UPDATE`s for the three current Shorts' titles/descriptions/thumbnails.
- No schema change. `videos_public_read` already allows anonymous reads of public rows, and `fetchShorts` filters on `is_public`/`is_short`, so the feed works signed-out as-is.
- Clip and thumbnail URLs are plain https (not `media://`), so they render without signed-URL resolution.
- Verification via a headless browser pass on `/shorts` with no session.
