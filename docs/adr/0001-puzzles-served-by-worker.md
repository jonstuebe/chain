# Puzzles are served one day at a time by the Worker; the dictionary ships with the client

The prototype inlined every Puzzle into the page, so anyone could view source and read every future ladder and its par route. Instead `puzzles.json` lives in the Cloudflare Worker, which serves `GET /api/puzzle/<YYYY-MM-DD>` only for a date that is "today" somewhere on Earth (UTC−12 to UTC+14) and returns `{ number, puzzle }`. Players must be online once per day; the Puzzle they fetch is cached in `localStorage` so play in progress still works offline. This is the same arrangement as Close Call.

The dictionary (`src/lib/words.json`, about 74 KB) does ship with the client. Checking each Step and computing Hints need it on every keystroke, offline included, and it's the same every day, so it reveals nothing about any Puzzle.

## Considered Options

- **Bundle every Puzzle:** leaks every future ladder and grows the bundle without bound.
- **Loop the list, as the prototype did:** a looped Puzzle's par route is already public.
- **Check Steps and Hints on the server:** would hide today's par route too, but costs offline play and a round-trip per Step. Today's par route reaching DevTools is accepted, as it is for Wordle.
- **KV, D1 or a Durable Object:** the data is read-only and keyed by date. Puzzles stay in git and publish with `npm run deploy`.

## Consequences

- The Puzzle number and Launch date live only on the server; the client asks for its local date.
- When the Puzzles run out the server returns 404 and the app shows "Back tomorrow". `npm run deploy` warns when fewer than 14 Puzzles remain.
- The prototype's `#p<n>` preview link is gone: the client can no longer see any Puzzle but today's. Use `npm run puzzle -- <start> <target> --dry-run` to check a ladder before adding it.
