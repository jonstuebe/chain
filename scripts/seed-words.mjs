// Loads data/dictionary.txt into the WORDS D1 database.
//   npm run seed-words            # local dev database
//   npm run seed-words -- --remote # production
// Re-running replaces every row, so edit dictionary.txt and seed again.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const remote = process.argv.includes('--remote');

const words = (await readFile(new URL('data/dictionary.txt', root), 'utf8')).split('\n').filter((w) => /^[a-z]{3,5}$/.test(w));

// D1 caps statement size, so insert in modest batches.
const BATCH = 500;
const lines = ['DELETE FROM words;'];
for (let i = 0; i < words.length; i += BATCH) {
  const rows = words.slice(i, i + BATCH).map((w) => `('${w}')`);
  lines.push(`INSERT INTO words (word) VALUES ${rows.join(',')};`);
}

await mkdir(new URL('.wrangler/', root), { recursive: true });
const file = new URL('.wrangler/seed-words.sql', root);
await writeFile(file, lines.join('\n') + '\n');

const target = remote ? '--remote' : '--local';
const run = (args) => execFileSync('npx', ['wrangler', 'd1', ...args], { cwd: root, stdio: 'inherit' });
run(['migrations', 'apply', 'WORDS', target]);
run(['execute', 'WORDS', target, '--yes', `--file=${file.pathname}`]);
console.log(`Seeded ${words.length} words (${target.slice(2)}).`);
