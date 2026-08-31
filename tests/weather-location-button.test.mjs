import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

// Minimal DOM with real EventTarget dispatch and text-node ownership.
class Element extends EventTarget {
  constructor(tagName = 'span') {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.style = {};
    this.disabled = false;
    this.attributes = {};
  }
  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = nodes;
    for (const child of nodes) child.parentNode = this;
  }
  set textContent(text) { this.replaceChildren({ textContent: String(text) }); }
  get textContent() { return this.children.map(child => child.textContent).join(''); }
  set innerText(text) { this.textContent = text; }
  get innerText() { return this.textContent; }
  setAttribute(name, value) { this.attributes[name] = value; }
}

function fixture() {
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, new Element()]));
  const location = elements.get('weatherLocationText');
  const initialIcon = new Element('i');
  initialIcon.className = 'fa-solid fa-location-dot';
  location.replaceChildren(initialIcon, {
    textContent: html.match(/id="weatherLocationText">[\s\S]*?<\/i>([^<]*)<\/span>/)[1],
  });
  const button = elements.get('btnWeatherCurrentLocation');
  button.innerHTML = 'Usa la mia posizione';
  const requests = [];
  let gpsSuccess, gpsError, gpsCalls = 0, mapView;
  const context = vm.createContext({
    window: {},
    document: {
      getElementById: id => elements.get(id) ?? null,
      createElement: tag => new Element(tag),
      createTextNode: text => ({ textContent: text, parentNode: null }),
    },
    navigator: { geolocation: { getCurrentPosition(success, error) { gpsCalls++; gpsSuccess = success; gpsError = error; } } },
    // Deliberately do not change getCenter in setView: prove GPS overrides it.
    map: { getCenter: () => ({ lat: 1, lng: 2 }), getZoom: () => 10, setView(view) { mapView = Array.from(view); } },
    fetch(url) { return new Promise((resolve, reject) => requests.push({ url, resolve, reject })); },
    CescoRiverStatus: { renderRiverStatus() {} },
  });
  const helperStart = app.indexOf('function setWeatherLocationContext(');
  const start = helperStart < 0 ? app.indexOf('function updateForecastData(') : helperStart;
  const end = app.indexOf('function switchTab(', start);
  const bindStart = app.indexOf('function bindWeatherLocationButton(');
  const bindEnd = app.indexOf('function bindImageProtections(', bindStart);
  vm.runInContext(app.slice(start, end) + app.slice(bindStart, bindEnd) + '\nbindWeatherLocationButton();', context);
  const respond = request => request.resolve({ ok: true, json: async () => ({ current: {
    weather_code: 0, temperature_2m: 20, apparent_temperature: 20, relative_humidity_2m: 50,
    wind_speed_10m: 1, wind_direction_10m: 0, surface_pressure: 1013, precipitation: 0, cloud_cover: 0
  }, hourly: { time: [], surface_pressure: [] }, daily: {} }) });
  return {
    context, elements, location, button, requests, respond,
    click: () => button.dispatchEvent(new Event('click')),
    success: coords => gpsSuccess({ coords }), error: code => gpsError({ code }),
    gpsCalls: () => gpsCalls, mapView: () => mapView,
  };
}

function assertLocation(f, source) {
  assert.equal(f.location.textContent.trim(), `Posizione analizzata: ${source}`);
  assert.equal(f.location.children[0].tagName, 'I');
  assert.equal(f.location.children[0].className, 'fa-solid fa-location-dot');
}

test('senza override il meteo imposta subito il contesto centro della mappa', async () => {
  const f = fixture();
  const request = vm.runInContext('updateForecastData()', f.context);
  assertLocation(f, 'centro della mappa');
  assert.match(f.requests[0].url, /latitude=1&longitude=2/);
  f.respond(f.requests[0]);
  await request;
  assertLocation(f, 'centro della mappa');
});

test('override GPS imposta il testo prima del fetch e lo conserva dopo il completamento', async () => {
  const f = fixture();
  const request = vm.runInContext('updateForecastData(null, {lat: 44.5, lng: 11.3})', f.context);
  assertLocation(f, 'posizione GPS');
  for (const { url } of f.requests) assert.match(url, /latitude=44.5&longitude=11.3/);
  f.respond(f.requests[0]);
  await request;
  assert.equal(f.elements.get('wTempLarge').innerText, '20°');
  assertLocation(f, 'posizione GPS');
});

test('click reale → Localizzo → GPS → mappa → fetch reale → etichetta GPS persistente', async () => {
  const f = fixture();
  f.click();
  assert.equal(f.gpsCalls(), 1);
  assert.match(f.button.innerHTML, /Localizzo/);
  f.success({ latitude: 44.5, longitude: 11.3 });
  assert.deepEqual(f.mapView(), [44.5, 11.3]);
  assert.match(f.requests[0].url, /latitude=44.5&longitude=11.3/);
  assert.match(f.button.innerHTML, /Aggiorno meteo/);
  assertLocation(f, 'posizione GPS');
  f.respond(f.requests[0]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.button.disabled, false);
  assertLocation(f, 'posizione GPS');
});

for (const [code, message] of [[1, /Permesso posizione negato/], [2, /Posizione non disponibile/], [3, /Timeout GPS/]]) {
  test(`errore GPS ${code} rimane visibile senza avviare fetch`, () => {
    const f = fixture();
    f.click(); f.error(code);
    assert.match(f.location.textContent, message);
    assert.equal(f.location.children[0].tagName, 'I');
    assert.equal(f.requests.length, 0);
    assert.equal(f.button.disabled, false);
  });
}

test('coordinate GPS non valide non aggiornano mappa o meteo', () => {
  const f = fixture(); f.click(); f.success({ latitude: NaN, longitude: 11.3 });
  assert.match(f.location.textContent, /Coordinate GPS non valide/);
  assert.equal(f.requests.length, 0);
  assert.equal(f.mapView(), undefined);
});

test('errore meteo conserva il contesto GPS e distingue il mancato aggiornamento', async () => {
  const f = fixture();
  const request = vm.runInContext('updateForecastData(null, {lat: 44.5, lng: 11.3})', f.context);
  f.requests[0].reject(new Error('offline'));
  await request;
  assert.match(f.location.textContent, /posizione GPS.*meteo non aggiornati/);
  assert.equal(f.location.children[0].tagName, 'I');
});

test('un vecchio errore GPS/meteo non sovrascrive un contesto successivo della mappa', async () => {
  const f = fixture();
  const oldRequest = vm.runInContext('updateForecastData(null, {lat: 44.5, lng: 11.3})', f.context);
  const newRequest = vm.runInContext('updateForecastData()', f.context);
  f.respond(f.requests[3]); await newRequest;
  f.requests[0].reject(new Error('vecchia richiesta'));
  await oldRequest;
  assertLocation(f, 'centro della mappa');
});
