import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il pinch zoom è consentito solo dentro la mappa', async () => {
  const [manifest, worker, source] = await Promise.all([
    read('js/manifest.js'),
    read('sw.js'),
    read('js/zoom-guard.js'),
  ]);

  assert.match(manifest, /js\/zoom-guard\.js/);
  assert.match(worker, /js\/zoom-guard\.js/);
  assert.match(source, /closest\('#map'\)/);
  assert.match(source, /gesturestart/);
  assert.match(source, /gesturechange/);
  assert.match(source, /touches\.length > 1/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.doesNotMatch(source, /user-scalable=no/);
});
