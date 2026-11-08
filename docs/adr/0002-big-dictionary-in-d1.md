# A big dictionary in D1 accepts extra Steps; the bundled list still decides Par

Players kept typing real words the bundled list (SCOWL, about 2,400 four-letter words) rejected. We now also load every 3–5 letter word from dwyl/english-words (about 25,000, public domain) into a D1 database bound to the Worker as `WORDS`. A Step the bundled list rejects is checked against it with `GET /api/words/<word>`. Words it accepts are remembered in `localStorage` (`chain:extra-words`), so they keep working offline.

This narrows ADR 0001: the bundled list still ships and still works offline, but it's no longer the only word list.

## Why the bundled list keeps deciding Par and Hints

dwyl is huge and full of obscure and abbreviated words (`corr`, `qoph`). If it fed the breadth-first search, it would quietly shorten Par on shipped Puzzles. Accepting "bing" alone already did that once. So Par, Hints and Dead ends come only from the bundled list. A Step onto a big-dictionary word routes through its bundled neighbours (`distanceOf`). Beating Par this way scores as Par.

## Considered Options

- **A Durable Object:** D1 is enough for a read-only word list.
- **Ship the big list in the bundle:** about 140 KB raw and offline-friendly. Rejected to keep the bundle small; a round-trip only happens for words the bundled list doesn't know.
- **Autocomplete as you type:** tried and dropped. Showing real words near what's typed gives away which Steps are legal.

## Consequences

- Offline, only bundled or already-accepted words count. The toast says "(offline)".
- After the first deploy, run `npm run seed-words -- --remote`, and again whenever `data/dictionary.txt` changes.
