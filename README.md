# Chain

A daily word ladder. Climb from the top word to the bottom word, one letter at a time; every step must be a real word. Par is the shortest possible chain. Then a spoiler-free result line like `🟩🟩🟩🟩🟨💡 +2`.

- One Puzzle per day, the same for everyone, chosen from the player's **local** date.
- A small Cloudflare Worker serves only today's Puzzle, so future ladders can't be read from the page source (see [ADR 0001](docs/adr/0001-puzzles-served-by-worker.md)).
- One attempt per day. Undo and climbing back are free; each Hint costs a stroke. Progress mid-puzzle, results, streaks and stats live in `localStorage` (`chain:v1`); today's Puzzle is cached in `chain:puzzle`.
- Installable PWA. It needs the network once a day to fetch the Puzzle; after that, today's game plays offline.

## Develop

```sh
npm install
npm run dev          # http://localhost:5173, with the Worker API running in workerd
npm run build        # typecheck + production build into dist/client (site) and dist/chain (Worker)
npm run preview      # serve the build, Worker included (service worker enabled)
```

Node 26 (`mise.toml`). The first `npm install` may ask you to approve native install scripts: `npm install-scripts approve workerd esbuild`.

## Test

```sh
npm test             # Vitest: date keys, the Worker's date gate, puzzle fetch/cache, step rules,
                     # hints, scoring, share text, storage and streaks, and every shipped Puzzle's Par
npm run test:e2e     # Playwright: plays to Par, over Par and a give-up, offline, theming, axe accessibility
```

## Deploy

```sh
npm run deploy       # build, then wrangler deploy to https://chain.jonstuebe.com
```

One Cloudflare Worker serves the static site and `GET /api/puzzle/<YYYY-MM-DD>`, which returns `{ number, puzzle }` only while that date is "today" somewhere on Earth (UTC−12 to UTC+14). Every other date gets a 404.

## Content

Puzzles live in `worker/puzzles.json` and never ship in the client bundle. Add one with:

```sh
npm run puzzle -- sail boat              # works out Par and a par route, and appends it
npm run puzzle -- sail boat --dry-run    # just show what it would add
```

The par route walks downhill from the start, preferring everyday words, and the script lists any word on it that isn't in the everyday list so you can judge whether it's fair. Then commit and `npm run deploy`. The build warns when fewer than 14 Puzzles are left after today.

- Puzzle number = days since `LAUNCH_DATE` in `worker/puzzles.ts` (Puzzle #1 on launch day). When the list runs out, players see "Back tomorrow"; it never loops.
- `route` is one shortest route, start and target included; Par is its step count. The unit tests check every shipped route is real words one letter apart and truly shortest.
- `src/lib/words.json` is the dictionary (3–5 letters, from SCOWL): `valid` is every word a step may land on, `common` the everyday subset Hints prefer. It ships to the client on purpose: it's the same every day, so it gives nothing away.

## Structure

```
worker/
  index.ts           GET /api/puzzle/:date with the "today somewhere" gate
  puzzles.ts         launch date, puzzle number, date window
  puzzles.json       every Puzzle (server only)
src/
  lib/daily.ts       fetch today's Puzzle, cache it for offline play
  lib/puzzle.ts      local date key, DST-safe day maths, next midnight
  lib/ladder.ts      step rules, distances to the target, Hints, scoring
  lib/words.ts       the dictionary, from words.json
  lib/share.ts       share text + Web Share API / clipboard fallback
  lib/storage.ts     versioned localStorage, streaks, stats
  lib/pwa.ts         service worker registration + update prompt
  components/        Game, Ladder, Keyboard, Result, modals, toasts
scripts/
  add-puzzle.mjs     npm run puzzle
  make-icons.mjs     PWA icons (npm run icons)
```
