import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il doppio click sulla mappa annulla il tap singolo prima di aprire il modal', async () => {
  const source = await read('js/app.js');
  const tapSource = await read('js/map-tap.js');
  assert.match(source, /doubleClickZoom:\s*false/);
  assert.doesNotMatch(source, /lastSpotMapClickAt/);
  assert.match(source, /CescoMapTap\.create/);

  let timerId = 0;
  const timers = new Map();
  const calls = [];
  const scope = { setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); } };
  new Function('globalThis', tapSource)(scope);
  const tap = scope.CescoMapTap.create({ onSingleTap: event => calls.push(event), schedule: scope.setTimeout, cancel: scope.clearTimeout, threshold: 320 });

  assert.equal(tap.handleClick({ id: 1 }), true);
  assert.equal(tap.hasPendingTap(), true);
  assert.equal(tap.handleClick({ id: 2 }), false);
  assert.equal(tap.hasPendingTap(), false);
  assert.deepEqual(calls, []);

  assert.equal(tap.handleClick({ id: 3 }), true);
  const pending = [...timers.values()][0];
  pending();
  assert.deepEqual(calls, [{ id: 3 }]);
});

test('la protezione non disabilita misurazione, pinch o zoom generale', async () => {
  const source = await read('js/app.js');
  assert.match(source, /if \(rulerActive\) \{/);
  assert.match(source, /map\.setView\(/);
  assert.match(source, /map\.flyTo\(/);
});
