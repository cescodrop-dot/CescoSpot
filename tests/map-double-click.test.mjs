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
  assert.match(source, /window\.CescoMapTap && typeof window\.CescoMapTap\.create === 'function'/);
  assert.match(source, /startSpotFromMap/);

  let timerId = 0;
  const timers = new Map();
  const calls = [];
  const scope = { setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); } };
  new Function('globalThis', tapSource)(scope);
  const tap = scope.CescoMapTap.create({ onSingleTap: event => calls.push(event), schedule: scope.setTimeout, cancel: scope.clearTimeout, threshold: 320 });

  const firstEvent = { latlng: { lat: 41.9, lng: 12.5 } };
  assert.equal(tap.handleClick(firstEvent), true);
  assert.equal(tap.hasPendingTap(), true);
  assert.equal(tap.handleClick({ latlng: { lat: 41.9, lng: 12.5 } }), false);
  assert.equal(tap.hasPendingTap(), false);
  assert.deepEqual(calls, []);

  const thirdEvent = { latlng: { lat: 42, lng: 13 } };
  assert.equal(tap.handleClick(thirdEvent), true);
  thirdEvent.latlng.lat = 0;
  thirdEvent.latlng.lng = 0;
  const pending = [...timers.values()][0];
  pending();
  assert.deepEqual(calls, [{ lat: 42, lng: 13 }]);

  assert.equal(tap.handleClick({}), false);
  assert.equal(tap.hasPendingTap(), false);
});

test('la protezione non disabilita misurazione, pinch o zoom generale', async () => {
  const [source, worker] = await Promise.all([read('js/app.js'), read('sw.js')]);
  assert.match(source, /if \(rulerActive\) \{/);
  assert.match(source, /map\.setView\(/);
  assert.match(source, /map\.flyTo\(/);
  assert.match(source, /map\.on\(['"]dblclick['"]/);
  assert.match(worker, /cescospot-v\d+/);
});

test('flusso Add Spot simulato: tap, marker, modal, salvataggio e riapertura', async () => {
  const tapSource = await read('js/map-tap.js');
  const scope = { setTimeout: (callback) => { callback(); return 1; }, clearTimeout() {} };
  new Function('globalThis', tapSource)(scope);

  const state = { marker: null, modal: false, spots: [], stored: null, rendered: 0 };
  const openModal = (lat, lng) => { state.modal = true; state.draft = { lat, lng }; };
  const tap = scope.CescoMapTap.create({
    schedule: scope.setTimeout,
    cancel: scope.clearTimeout,
    onSingleTap: ({ lat, lng }) => {
      state.marker = { lat, lng };
      openModal(lat, lng);
    }
  });

  tap.handleClick({ latlng: { lat: 43.7, lng: 10.4 } });
  assert.deepEqual(state.marker, { lat: 43.7, lng: 10.4 });
  assert.equal(state.modal, true);
  state.spots.push({ id: 'spot-1', ...state.draft, name: 'Test' });
  state.stored = structuredClone(state.spots);
  state.rendered += 1;
  state.modal = false;
  state.marker = null;
  state.spots = structuredClone(state.stored);
  state.rendered += 1;
  assert.equal(state.spots[0].name, 'Test');
  assert.deepEqual(state.spots[0], { id: 'spot-1', lat: 43.7, lng: 10.4, name: 'Test' });
  assert.equal(state.rendered, 2);
});
