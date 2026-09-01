import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('riepilogo meteo usa indicatori osservabili e resta offline', async () => {
  const [source, html, manifest, worker, css] = await Promise.all([
    read('js/weather-insights.js'),
    read('index.html'),
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

  assert.match(html, /js\/weather-insights\.js/);
  assert.match(manifest, /styles\/weather-insights\.css/);
  assert.match(worker, /js\/weather-insights\.js/);
  assert.match(worker, /styles\/weather-insights\.css/);
  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+'/);
  assert.match(css, /field-conditions-grid/);
  assert.match(source, /CescoWeatherInsights = \{ ensureCard, refresh \}/);
  assert.doesNotMatch(source, /MutationObserver|setInterval|\[onclick\*="useCurrentLocationForForecast"\]/);
});

test('il riepilogo sul posto ignora una risposta vecchia dopo un refresh piu recente', async () => {
  class Element {
    constructor() { this.textContent = ''; }
  }
  const elements = new Map([
    'tabForecasts', 'weatherFieldConditions', 'fieldWind', 'fieldWindDir', 'fieldGust',
    'fieldRain3h', 'fieldRainChance', 'fieldPressure', 'fieldPressureTrend'
  ].map(id => [id, new Element()]));
  const requests = [];
  const context = vm.createContext({
    document: {
      readyState: 'complete',
      getElementById: id => elements.get(id) ?? null,
      querySelector: () => null,
    },
    URLSearchParams,
    fetch: url => new Promise((resolve, reject) => requests.push({ url, resolve, reject })),
    console: { warn() {} },
  });
  vm.runInContext(await read('js/weather-insights.js'), context);

  const requestA = context.CescoWeatherInsights.refresh({ lat: 41.1, lng: 12.1 }, 1, () => true);
  const requestB = context.CescoWeatherInsights.refresh({ lat: 45.4, lng: 9.2 }, 2, () => true);
  const response = wind => ({ ok: true, json: async () => ({
    current: { wind_speed_10m: wind, wind_gusts_10m: wind + 2, wind_direction_10m: 90, surface_pressure: 1013 },
    hourly: { time: [new Date(Date.now() + 60_000).toISOString()], precipitation: [0], precipitation_probability: [0], surface_pressure: [1013] }
  }) });

  requests[1].resolve(response(24));
  await requestB;
  assert.equal(elements.get('fieldWind').textContent, '24 km/h');
  requests[0].resolve(response(8));
  await requestA;
  assert.equal(elements.get('fieldWind').textContent, '24 km/h');
});
