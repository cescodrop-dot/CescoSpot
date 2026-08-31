import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('la cache PWA è incrementata e include app.js', async () => {
  const source = await read('sw.js');
  const match = source.match(/const CACHE_VERSION = 'cescospot-v(\d+)'/);
  assert.ok(match, 'CACHE_VERSION numerata non trovata');
  assert.ok(Number(match[1]) >= 16, 'incrementare CACHE_VERSION quando cambia app.js');
  assert.match(source, /'\.\/js\/app\.js'/);
  assert.match(source, /'\.\/js\/storage-readiness\.js'/);
});

test('activate elimina le cache precedenti', async () => {
  const source = await read('sw.js');
  assert.match(source, /keys\.filter\(key => key !== CACHE_VERSION/);
  assert.match(source, /caches\.delete\(key\)/);
});
