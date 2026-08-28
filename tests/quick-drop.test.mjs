import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('app.js non definisce più quickDropSpot', async () => {
  const source = await read('js/app.js');
  assert.doesNotMatch(source, /function\s+quickDropSpot\s*\(/);
  assert.doesNotMatch(source, /center\.lat\.toFixed\(4\)/);
  assert.match(source, /function\s+shareSpot\s*\(/);
});

test('quick-drop.js è il proprietario dello Spot rapido', async () => {
  const source = await read('js/quick-drop.js');
  assert.match(source, /globalScope\.quickDropSpot\s*=\s*function\s+quickDropSpot/);
  assert.match(source, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(source, /persistSpots\(\)/);
  assert.match(source, /renderMapSpots\(\)/);
  assert.match(source, /weatherLocationText/);
  assert.match(source, /flood-api|reverse\?format=json/);
});

test('l’interfaccia conserva la chiamata allo Spot rapido e il modulo è caricato', async () => {
  const [html, manifest, worker] = await Promise.all([
    read('index.html'),
    read('js/manifest.js'),
    read('sw.js')
  ]);
  assert.match(html, /onclick="quickDropSpot\(\)"/);
  assert.ok(manifest.includes('js/quick-drop.js'));
  assert.ok(worker.includes('./js/quick-drop.js'));
});
