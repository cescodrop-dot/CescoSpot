import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

async function handlerFixture(geolocation) {
  const app = globalThis.__weatherAppSource;
  const bindStart = app.indexOf('function bindWeatherLocationButton(');
  const bindEnd = app.indexOf('\n    function bindImageProtections', bindStart);
  const useStart = app.indexOf('function useCurrentLocationForForecast(');
  const useEnd = app.indexOf('\n    function switchTab(', useStart);
  let clickHandler;
  let mapView;
  const button = { innerHTML: 'Usa la mia posizione', disabled: false, addEventListener(type, handler) { assert.equal(type, 'click'); clickHandler = handler; } };
  const locationText = { innerText: '' };
  let forecastArgs;
  const context = vm.createContext({
    window: { matchMedia: () => ({ matches: false }), navigator: { standalone: false }, addEventListener() {} },
    document: { getElementById(id) { return id === 'btnWeatherCurrentLocation' ? button : locationText; }, addEventListener() {} },
    navigator: { geolocation },
    map: { getZoom: () => 10, setView(view) { mapView = view; } },
    updateForecastData(...args) { forecastArgs = args; return Promise.resolve(true); }, Promise
  });
  vm.runInContext(app.slice(bindStart, bindEnd) + app.slice(useStart, useEnd) + '\nbindWeatherLocationButton();', context);
  assert.equal(typeof clickHandler, 'function');
  return { clickHandler, button, locationText, getMapView: () => mapView, getForecastArgs: () => forecastArgs };
}

test('successo GPS passa le coordinate esatte al meteo e aggiorna la mappa', async () => {
  globalThis.__weatherAppSource = await read('js/app.js');
  let gpsCalls = 0;
  const fixture = await handlerFixture({ getCurrentPosition(success) { gpsCalls++; success({ coords: { latitude: 44.5, longitude: 11.3 } }); } });
  fixture.clickHandler();
  await Promise.resolve();
  assert.equal(gpsCalls, 1);
  assert.equal(fixture.getMapView()[0], 44.5);
  assert.equal(fixture.getMapView()[1], 11.3);
  assert.equal(fixture.getForecastArgs()[0], null);
  assert.equal(fixture.getForecastArgs()[1].lat, 44.5);
  assert.equal(fixture.getForecastArgs()[1].lng, 11.3);
  assert.match(fixture.locationText.innerText, /Posizione GPS acquisita/);
  assert.equal(fixture.button.disabled, false);
});

for (const [name, code, expected] of [['permesso negato', 1, 'Permesso posizione negato'], ['timeout', 3, 'Timeout GPS'], ['posizione non disponibile', 2, 'Posizione non disponibile']]) {
  test(`GPS: ${name}`, async () => {
    globalThis.__weatherAppSource = await read('js/app.js');
    const fixture = await handlerFixture({ getCurrentPosition(_success, error) { error({ code }); } });
    fixture.clickHandler();
    assert.match(fixture.locationText.innerText, new RegExp(expected));
    assert.equal(fixture.getForecastArgs(), undefined);
  });
}

test('coordinate GPS non valide non avviano il meteo', async () => {
  globalThis.__weatherAppSource = await read('js/app.js');
  const fixture = await handlerFixture({ getCurrentPosition(success) { success({ coords: { latitude: NaN, longitude: 11.3 } }); } });
  fixture.clickHandler();
  assert.match(fixture.locationText.innerText, /Coordinate GPS non valide/);
  assert.equal(fixture.getForecastArgs(), undefined);
});

test('updateForecastData usa il centro mappa senza override e le coordinate esplicite con override', async () => {
  const app = await read('js/app.js');
  const start = app.indexOf('function updateForecastData(');
  const end = app.indexOf('\n    function useCurrentLocationForForecast(', start);
  const elements = new Proxy({}, { get: (target, id) => target[id] ||= { innerText: '', innerHTML: '', style: {} } });
  const urls = [];
  const response = { ok: true, json: async () => ({ current: { weather_code: 0, temperature_2m: 20, apparent_temperature: 20, relative_humidity_2m: 50, wind_speed_10m: 1, wind_direction_10m: 0, surface_pressure: 1013, precipitation: 0, cloud_cover: 0 }, hourly: { time: [], surface_pressure: [] }, daily: {} }) };
  const context = vm.createContext({ window: {}, document: { getElementById: id => elements[id] }, map: { getCenter: () => ({ lat: 1, lng: 2 }) }, fetch(url) { urls.push(url); return Promise.resolve(response); }, CescoRiverStatus: { renderRiverStatus() {} }, Promise });
  vm.runInContext(app.slice(start, end), context);
  await vm.runInContext('updateForecastData()', context);
  assert.match(urls[0], /latitude=1&longitude=2/);
  urls.length = 0;
  await vm.runInContext('updateForecastData(null, {lat: 44.5, lng: 11.3})', context);
  assert.match(urls[0], /latitude=44.5&longitude=11.3/);
});
