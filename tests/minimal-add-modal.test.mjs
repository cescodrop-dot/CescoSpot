import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il nuovo Add Spot usa solo il reset sincrono sicuro prima di aprire il modal', async () => {
  const app = await read('js/app.js');
  const html = await read('index.html');
  const start = app.indexOf('function openAddSpotModal(');
  const end = app.indexOf('\n    function closeModals()', start);
  const fn = app.slice(start, end);
  const resetStart = app.indexOf('function resetAddSpotFormState()');
  const resetEnd = app.indexOf('\n\n    function openAddSpotModal', resetStart);
  const reset = app.slice(resetStart, resetEnd);
  assert.match(html, /class="fab-add" onclick="openAddSpotModal\(\)"/);
  assert.match(fn, /resetAddSpotFormState\(\)/);
  assert.match(fn, /Number\.isFinite\(lat\).*map\.getCenter/);
  assert.match(fn, /getElementById\('tempLat'\)/);
  assert.match(fn, /getElementById\('tempLng'\)/);
  assert.match(fn, /classList\.add\('open'\)/);
  assert.doesNotMatch(fn, /fetch|CescoModalAccessibility|removePhoto|renderTechnique|renderSpecies|renderSpotLure|detectWaterEnvironment|focus|Promise|setTimeout|setInterval/);
  assert.doesNotMatch(reset, /fetch|CescoModalAccessibility|MutationObserver|removePhoto|detectWaterEnvironment|focus|Promise|setTimeout|setInterval|map\./);
  assert.doesNotMatch(html, /<script src="js\/modal-accessibility\.js"><\/script>/);
});
