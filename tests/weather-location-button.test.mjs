import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il click reale del pulsante meteo invoca il GPS e aggiorna la mappa', async () => {
  const [app, html] = await Promise.all([read('js/app.js'), read('index.html')]);
  assert.match(html, /id="btnWeatherCurrentLocation"/);
  assert.doesNotMatch(html, /onclick="useCurrentLocationForForecast/);

  const start = app.indexOf('function useCurrentLocationForForecast(');
  const end = app.indexOf('    function switchTab(', start);
  const source = app.slice(start, end);
  let clickHandler;
  let gpsCalls = 0;
  let mapView;
  let forecastCalls = 0;
  const button = {
    innerHTML: 'Usa la mia posizione', disabled: false,
    addEventListener(type, handler) { assert.equal(type, 'click'); clickHandler = handler; }
  };
  const locationText = { innerText: '' };
  const context = vm.createContext({
    document: { getElementById(id) { return id === 'btnWeatherCurrentLocation' ? button : locationText; } },
    navigator: { geolocation: { getCurrentPosition(success) { gpsCalls++; success({ coords: { latitude: 44.5, longitude: 11.3 } }); } } },
    map: { getZoom: () => 10, setView(view) { mapView = view; } },
    updateForecastData() { forecastCalls++; }
  });
  vm.runInContext(source, context);
  assert.equal(typeof clickHandler, 'function');
  clickHandler();
  assert.equal(gpsCalls, 1);
  assert.equal(mapView[0], 44.5);
  assert.equal(mapView[1], 11.3);
  assert.equal(forecastCalls, 1);
});
