import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('la cache PWA usa una versione numerata', async () => {
  const worker = await readFile(new URL('sw.js', root), 'utf8');
  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+';/);
});
