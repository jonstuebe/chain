// Appends a Puzzle to worker/puzzles.json, with Par and a par route worked out from the word list.
// Usage: npm run puzzle -- <start> <target> [--dry-run]
import { readFile, writeFile } from 'node:fs/promises';

const PUZZLES = new URL('../worker/puzzles.json', import.meta.url);
const WORDS = new URL('../src/lib/words.json', import.meta.url);
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [start, target] = args.filter((a) => !a.startsWith('--')).map((w) => w.toLowerCase());
if (!start || !target) fail('Usage: npm run puzzle -- <start> <target> [--dry-run]');

const words = JSON.parse(await readFile(WORDS, 'utf8'));
const valid = new Set(words.valid.split(' '));
const common = new Set(words.common.split(' '));

if (start.length !== target.length) fail(`${start} and ${target} need the same number of letters.`);
for (const w of [start, target]) if (!valid.has(w)) fail(`${w} isn't in src/lib/words.json.`);
if (start === target) fail('Start and target must differ.');

const neighbours = (word) => {
  const out = [];
  for (let i = 0; i < word.length; i++)
    for (const c of ALPHABET) {
      if (c === word[i]) continue;
      const next = word.slice(0, i) + c + word.slice(i + 1);
      if (valid.has(next)) out.push(next);
    }
  return out;
};

// Fewest steps to the target from every word, then walk downhill from the start,
// preferring everyday words so the par route shown on the reveal reads naturally.
const distances = new Map([[target, 0]]);
const queue = [target];
for (let head = 0; head < queue.length; head++) {
  for (const n of neighbours(queue[head])) {
    if (distances.has(n)) continue;
    distances.set(n, distances.get(queue[head]) + 1);
    queue.push(n);
  }
}
if (!distances.has(start)) fail(`There's no route from ${start} to ${target}.`);

const route = [start];
while (route.at(-1) !== target) {
  const here = distances.get(route.at(-1));
  const closer = neighbours(route.at(-1)).filter((n) => distances.get(n) === here - 1);
  route.push(closer.find((n) => common.has(n)) ?? closer[0]);
}

const puzzles = JSON.parse(await readFile(PUZZLES, 'utf8'));
if (puzzles.some((p) => p.start === start && p.target === target)) fail(`${start} → ${target} is already Puzzle ${puzzles.find((p) => p.start === start && p.target === target).id}.`);

const puzzle = { id: puzzles.length + 1, start, target, route };
console.log(`#${puzzle.id} ${start.toUpperCase()} → ${target.toUpperCase()}, par ${route.length - 1}: ${route.join(' → ')}`);
const uncommon = route.filter((w) => !common.has(w));
if (uncommon.length) console.log(`  Check these are fair: ${uncommon.join(', ')} (not in the everyday list).`);
if (dryRun) process.exit(0);

puzzles.push(puzzle);
await writeFile(PUZZLES, `[\n${puzzles.map((p) => `  ${JSON.stringify(p)}`).join(',\n')}\n]\n`);
console.log('  Added to worker/puzzles.json.');

function fail(message) {
  console.error(message);
  process.exit(1);
}
