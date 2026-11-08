/** The slice of the D1 binding this Worker uses, so tests can stand in for it. */
export interface WordsDb {
  prepare(query: string): { bind(...values: unknown[]): { first<T>(): Promise<T | null> } };
}

const WORD = /^[a-z]{3,5}$/;

/** `GET /api/words/<word>`: whether the big dictionary has it. */
export async function handleWords(request: Request, db: WordsDb): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, HEAD' });

  const lookup = /^\/api\/words\/([^/]+)$/.exec(url.pathname);
  if (!lookup) return json({ error: 'Not found' }, 404);
  const word = decodeURIComponent(lookup[1]).toLowerCase();
  if (!WORD.test(word)) return json({ word, valid: false }, 200, CACHE_DAY);
  const row = await db.prepare('SELECT 1 AS ok FROM words WHERE word = ?').bind(word).first<{ ok: number }>();
  return json({ word, valid: row !== null }, 200, CACHE_DAY);
}

// The dictionary only changes on a reseed; a day of caching is plenty.
const CACHE_DAY = { 'Cache-Control': 'public, max-age=86400' };

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(status === 200 ? {} : { 'Cache-Control': 'no-store' }), ...headers },
  });
}
