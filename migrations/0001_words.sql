-- The big dictionary: every 3- to 5-letter word players may step on, beyond the
-- bundled list. Rows come from data/dictionary.txt via `npm run seed-words`.
CREATE TABLE words (
  word TEXT PRIMARY KEY NOT NULL
) WITHOUT ROWID;
