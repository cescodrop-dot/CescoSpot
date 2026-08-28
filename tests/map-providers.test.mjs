import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('app.js mantiene solo l’istanza della mappa senza provider legacy', async () => {
  const source = await read('js/app.js');
  assert.match(source, /const map = L\.map\('map'/);
  assert.doesNotMatch(source, /mt1\.google\.com/);
  assert.doesNotMatch(source, /function\s+toggleMapType\s*\(/);
  assert.doesNotMatch(source, /const\s+(?:satLayer|topoLayer)\s*=/);
  assert.doesNotMatch(source, /let\s+isSat\s*=/);
});

test('map-providers.js possiede toggleMapType e attribuzione', async () => {
  const source = await read('js/map-providers.js');
  assert.match(source, /globalScope\.toggleMapType\s*=\s*function\s+toggleMapType/);
  assert.match(source, /L\.control\.attribution/);
  assert.match(source, /ESRI_IMAGERY_URL/);
  assert.match(source, /TOPO_URL/);
});

test('i provider mappa restano caricati anche offline', async () => {
  const [manifest, worker] = await Promise.all([read('js/manifest.js'), read('sw.js')]);
  assert.ok(manifest.includes('js/map-providers.js'));
  assert.ok(worker.includes('./js/map-providers.js'));
  assert.match(worker, /cescospot-v\\d+/);
});
