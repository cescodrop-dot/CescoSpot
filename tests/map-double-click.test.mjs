import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('la mappa non avvia lo zoom sul doppio click e ignora il secondo click per gli spot', async () => {
  const source = await read('js/app.js');
  assert.match(source, /doubleClickZoom:\s*false/);
  assert.match(source, /let lastSpotMapClickAt\s*=\s*0/);
  assert.match(source, /now - lastSpotMapClickAt < 350/);
  assert.match(source, /lastSpotMapClickAt\s*=\s*now/);
});

test('la protezione non disabilita misurazione, pinch o zoom generale', async () => {
  const source = await read('js/app.js');
  assert.match(source, /if \(rulerActive\) \{/);
  assert.match(source, /map\.setView\(/);
  assert.match(source, /map\.flyTo\(/);
});
