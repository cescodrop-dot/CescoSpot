import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('l app blocca lo zoom pagina prima del rendering', async () => {
  const manifest = await read('js/manifest.js');
  const worker = await read('sw.js');

  assert.match(manifest, /maximum-scale=1\.0/);
  assert.match(manifest, /user-scalable=no/);
  assert.match(worker, /LOCKED_VIEWPORT/);
  assert.match(worker, /maximum-scale=1\.0/);
  assert.match(worker, /user-scalable=no/);
  assert.match(worker, /withLockedViewport/);
  assert.match(worker, /mode === 'navigate'/);
  assert.doesNotMatch(manifest, /zoom-guard\.js/);
  assert.doesNotMatch(worker, /zoom-guard\.js/);
});

test('il riepilogo meteo mobile resta centrato', async () => {
  const css = await read('styles/mobile-polish.css');

  assert.match(css, /#tabForecasts \.weather-hero-card[\s\S]*display:\s*flex/);
  assert.match(css, /#tabForecasts \.weather-hero-card[\s\S]*align-items:\s*center/);
  assert.match(css, /#tabForecasts \.weather-hero-card[\s\S]*text-align:\s*center/);
  assert.match(css, /#tabForecasts \.w-desc-text[\s\S]*text-align:\s*center/);
});
