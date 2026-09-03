import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il service worker riscrive il viewport bloccato prima del parsing della pagina', async () => {
  const worker = await read('sw.js');

  assert.match(worker, /LOCKED_VIEWPORT/);
  assert.match(worker, /maximum-scale=1\.0/);
  assert.match(worker, /user-scalable=no/);
  assert.match(worker, /width=device-width/);
  assert.match(worker, /initial-scale=1\.0/);
  assert.match(worker, /viewport-fit=cover/);
  assert.match(worker, /html\.replace/);
  assert.match(worker, /withLockedViewport\(response\)/);
  assert.match(worker, /withLockedViewport\(cached\)/);
  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+';/);
});
