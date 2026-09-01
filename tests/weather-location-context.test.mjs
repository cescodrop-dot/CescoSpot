import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

class Element extends EventTarget {
  constructor(id = '') {
    super();
    this.id = id;
    this.children = [];
    this.style = {};
    this.inert = false;
    this.disabled = false;
    this.attributes = {};
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
    };
  }
  replaceChildren(...nodes) { this.children = nodes; }
  set textContent(value) { this.replaceChildren({ textContent: String(value) }); }
  get textContent() { return this.children.map(child => child.textContent).join(''); }
  set innerText(value) { this.textContent = value; }
  get innerText() { return this.textContent; }
  setAttribute(name, value) { this.attributes[name] = value; }
}

function fixture() {
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, new Element(id)]));
  const ids = ['tabMap', 'tabForecasts', 'tabRigLab', 'tabWiki', 'tabMe'];
  const tabs = ids.map(id => new Element(id));
  const nav = ids.map(id => new Element('nav-' + id));
  tabs.forEach(tab => tab.classList.add('tab-content'));
  nav.forEach(item => item.classList.add('nav-item'));
  tabs[0].classList.add('active');
  nav[0].classList.add('active');
  for (const tab of tabs) elements.set(tab.id, tab);

  const requests = [];
  let center = { lat: 41.9, lng: 12.5 };
  const context = vm.createContext({
    window: {
      matchMedia: () => ({ matches: true }),
      CescoWeatherInsights: { refresh() {} },
    },
    document: {
      getElementById: id => elements.get(id) ?? null,
      querySelector: selector => selector === '.tab-content.active' ? tabs.find(tab => tab.classList.contains('active')) : null,
      querySelectorAll: selector => selector === '.nav-item' ? nav : selector === '.tab-content' ? tabs : [],
      createElement: () => new Element(),
      createTextNode: text => ({ textContent: String(text) }),
    },
    map: {
      getCenter: () => ({ ...center }),
      getZoom: () => 12,
      setView() {},
      invalidateSize() {},
    },
    CescoRiverStatus: { renderRiverStatus() {} },
    fetch: url => new Promise(resolve => requests.push({ url, resolve })),
    setTimeout() { return 0; },
    clearTimeout() {},
    getComputedStyle: () => ({ getPropertyValue: () => '220ms' }),
  });
  const start = app.indexOf('function setWeatherLocationContext(');
  const end = app.indexOf('let watchId =', start);
  vm.runInContext(app.slice(start, end), context);
  return {
    context, requests,
    setCenter: value => { center = value; },
    go: id => context.switchTab(id, nav[ids.indexOf(id)]),
  };
}

const coordinatesFrom = request => new URL(request.url).searchParams;
const latestForecast = fixture => coordinatesFrom(fixture.requests.at(-3));

test('GPS → altra tab → Meteo mantiene le coordinate GPS nel refresh di rientro', () => {
  const f = fixture();
  vm.runInContext('updateForecastData(null, { lat: 44.5, lng: 11.3 })', f.context);
  f.go('tabRigLab');
  f.go('tabForecasts');
  const params = coordinatesFrom(f.requests.at(-3));
  assert.equal(params.get('latitude'), '44.5');
  assert.equal(params.get('longitude'), '11.3');
  assert.match(f.context.document.getElementById('weatherLocationText').textContent, /posizione GPS/);
});

test('refresh manuale dopo GPS continua a usare il contesto GPS della sessione', () => {
  const f = fixture();
  vm.runInContext('updateForecastData(null, { lat: 44.5, lng: 11.3 })', f.context);
  vm.runInContext('updateForecastData(document.getElementById("btnUpdateWeather"))', f.context);
  const params = latestForecast(f);
  assert.equal(params.get('latitude'), '44.5');
  assert.equal(params.get('longitude'), '11.3');
});

test('contesto mappa usa il centro attuale, non coordinate mappa memorizzate', () => {
  const f = fixture();
  vm.runInContext('updateForecastData()', f.context);
  f.go('tabRigLab');
  f.setCenter({ lat: 43.7, lng: 10.4 });
  f.go('tabForecasts');
  const params = latestForecast(f);
  assert.equal(params.get('latitude'), '43.7');
  assert.equal(params.get('longitude'), '10.4');
});

test('l ultimo GPS valido sostituisce il precedente anche dopo il rientro nella tab Meteo', () => {
  const f = fixture();
  vm.runInContext('updateForecastData(null, { lat: 44.5, lng: 11.3 })', f.context);
  vm.runInContext('updateForecastData(null, { lat: 45.5, lng: 9.2 })', f.context);
  f.go('tabRigLab');
  f.go('tabForecasts');
  const params = latestForecast(f);
  assert.equal(params.get('latitude'), '45.5');
  assert.equal(params.get('longitude'), '9.2');
});

test('la tab Meteo gia attiva non avvia un refresh aggiuntivo', () => {
  const f = fixture();
  f.go('tabForecasts');
  const count = f.requests.length;
  f.go('tabForecasts');
  assert.equal(f.requests.length, count);
});
