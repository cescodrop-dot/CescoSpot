import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('app.js non definisce più quickDropSpot', async () => {
  const source = await read('js/app.js');
  assert.doesNotMatch(source, /function\s+quickDropSpot\s*\(/);
  assert.doesNotMatch(source, /center\.lat\.toFixed\(4\)/);
  assert.match(source, /function\s+shareSpot\s*\(/);
});

test('quick-drop.js è il proprietario dello Spot rapido senza possedere il contesto Meteo', async () => {
  const source = await read('js/quick-drop.js');
  assert.match(source, /globalScope\.quickDropSpot\s*=\s*function\s+quickDropSpot/);
  assert.match(source, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(source, /persistSpots\(\)/);
  assert.match(source, /renderMapSpots\(\)/);
  assert.doesNotMatch(source, /weatherLocationText/);
  assert.doesNotMatch(source, /updateForecastData|setWeatherLocationContext/);
  assert.match(source, /flood-api|reverse\?format=json/);
});

test('Spot Rapido salva con il proprio GPS senza cambiare label, contesto o dati Meteo esistenti', async () => {
  const source = await read('js/quick-drop.js');
  let gpsSuccess;
  let persistCalls = 0;
  let renderCalls = 0;
  let refreshCalls = 0;
  let contextCalls = 0;
  const weatherLocationText = { innerHTML: '<i></i> Posizione analizzata: posizione A' };
  const weatherTemperature = { innerText: '21°' };
  const elements = new Map([
    ['weatherLocationText', weatherLocationText],
    ['wTempLarge', weatherTemperature]
  ]);
  const spots = [];
  const context = vm.createContext({
    document: { readyState: 'complete', getElementById: id => elements.get(id) ?? null },
    navigator: {
      geolocation: {
        getCurrentPosition(success) { gpsSuccess = success; }
      }
    },
    CescoStorageReadiness: { ensureWriteReady: () => true },
    spots,
    L: { latLng: (lat, lng) => ({ lat, lng, distanceTo: () => Infinity }) },
    persistSpots: async () => { persistCalls += 1; return true; },
    renderMapSpots: () => { renderCalls += 1; },
    renderSavedSpotsUI: () => {},
    map: { flyTo() {} },
    fetch: async () => ({ ok: true, json: async () => ({ address: {} }) }),
    alert() {},
    updateForecastData: () => { refreshCalls += 1; },
    setWeatherLocationContext: () => { contextCalls += 1; },
    Date,
    Promise,
    console
  });
  vm.runInContext(source, context, { filename: 'quick-drop.js' });

  context.quickDropSpot();
  gpsSuccess({ coords: { latitude: 44.5, longitude: 11.3 } });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(spots.length, 1);
  assert.equal(spots[0].lat, 44.5);
  assert.equal(spots[0].lng, 11.3);
  assert.ok(persistCalls >= 1);
  assert.equal(renderCalls, 1);
  assert.equal(weatherLocationText.innerHTML, '<i></i> Posizione analizzata: posizione A');
  assert.equal(weatherTemperature.innerText, '21°');
  assert.equal(refreshCalls, 0);
  assert.equal(contextCalls, 0);
});

test('l’interfaccia conserva la chiamata allo Spot rapido e il modulo è caricato', async () => {
  const [html, worker] = await Promise.all([
    read('index.html'),
    read('sw.js')
  ]);
  assert.match(html, /onclick="quickDropSpot\(\)"/);
  assert.ok(html.includes('js/quick-drop.js'));
  assert.ok(worker.includes('./js/quick-drop.js'));
});
