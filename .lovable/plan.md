# YouTube-red theme and more Shorts

## What changes

- Update the global light and dark theme tokens so primary actions, active states, likes, and branded accents use a YouTube-like red while retaining neutral black, white, and gray surfaces.
- Add another batch of public short-form videos with fun, curious titles and working media/thumbnail URLs, distributed across existing demo channels.
- Keep all Shorts watchable while signed out and preserve the current like/comment sign-in behavior.

## Technical details

- Use semantic color tokens in `src/styles.css`; no component-level hardcoded palette.
- Add a data-only database migration with literal `videos` rows (`is_short = true`, `is_public = true`, under 60 seconds).
- Verify the public `/shorts` feed in a signed-out browser at desktop and mobile-relevant widths, including playback and red theme presentation.
