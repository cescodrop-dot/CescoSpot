import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('diagnostic blue button opens only the modal class', async () => {
  const app = await read('js/app.js');
  const html = await read('index.html');
  const start = app.indexOf('function openAddSpotModal(');
  const end = app.indexOf('\n    function closeModals()', start);
  const fn = app.slice(start, end);
  assert.match(html, /class="fab-add" onclick="openAddSpotModal\(\)"/);
  assert.match(fn, /editingSpotId\s*=\s*null/);
  assert.match(fn, /Number\.isFinite\(lat\).*map\.getCenter/);
  assert.match(fn, /getElementById\('tempLat'\)/);
  assert.match(fn, /getElementById\('tempLng'\)/);
  assert.match(fn, /classList\.add\('open'\)/);
  assert.doesNotMatch(fn, /fetch|CescoModalAccessibility|removePhoto|renderTechnique|renderSpecies|renderSpotLure|detectWaterEnvironment|focus/);
  assert.doesNotMatch(html, /<script src="js\/modal-accessibility\.js"><\/script>/);
});
