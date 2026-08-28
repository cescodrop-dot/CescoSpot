import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('riepilogo meteo usa indicatori osservabili e resta offline', async () => {
  const [source, manifest, worker, css] = await Promise.all([
    read('js/weather-insights.js'),
    read('js/manifest.js'),
    read('sw.js'),
    read('styles/weather-insights.css'),
  ]);

  assert.match(source, /wind_gusts_10m/);
  assert.match(source, /precipitation_probability/);
  assert.match(source, /surface_pressure/);
  assert.match(source, /Condizioni sul posto/);
  assert.match(source, /senza punteggi di pescabilità/);
  assert.doesNotMatch(source, /bite score|fishability score/i);

  assert.match(manifest, /js\/weather-insights\.js/);
  assert.match(manifest, /styles\/weather-insights\.css/);
  assert.match(worker, /js\/weather-insights\.js/);
  assert.match(worker, /styles\/weather-insights\.css/);
  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+'/);
  assert.match(css, /field-conditions-grid/);
});
