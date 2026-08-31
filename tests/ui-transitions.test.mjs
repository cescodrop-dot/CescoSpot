import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles/app.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const source = app.slice(app.indexOf('let cancelTabTransition ='), app.indexOf('let watchId ='));

class Control extends EventTarget {
  constructor(id, ...classes) {
    super(); this.id = id; this.inert = false;
    const values = new Set(classes);
    this.classList = {
      add: (...names) => names.forEach(name => values.add(name)),
      remove: (...names) => names.forEach(name => values.delete(name)),
      contains: name => values.has(name),
    };
  }
  end(name) {
    const event = new Event('animationend');
    event.animationName = name;
    this.dispatchEvent(event);
  }
}

function fixture(reduced = false) {
  const ids = ['tabMap', 'tabForecasts', 'tabRigLab', 'tabWiki', 'tabMe'];
  const tabs = ids.map(id => new Control(id, 'tab-content'));
  const nav = ids.map(id => new Control('nav-' + id, 'nav-item'));
  tabs[0].classList.add('active'); nav[0].classList.add('active');
  const timers = new Map();
  let lastTimer = 0, weatherCalls = 0, mapCalls = 0;
  const context = vm.createContext({
    document: {
      getElementById: id => tabs.find(tab => tab.id === id),
      querySelector: () => tabs.find(tab => tab.classList.contains('active')),
      querySelectorAll: selector => selector === '.nav-item' ? nav : tabs,
    },
    window: { matchMedia: () => ({ matches: reduced }) },
    getComputedStyle: () => ({ getPropertyValue: () => '220ms' }),
    setTimeout(fn, delay) { const id = ++lastTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    map: { invalidateSize() {
      assert.ok(tabs[0].classList.contains('active'));
      assert.ok(!tabs[0].classList.contains('is-entering'));
      mapCalls++;
    } },
    updateForecastData() { weatherCalls++; },
  });
  vm.runInContext(source, context);
  const go = id => context.switchTab(id, nav[ids.indexOf(id)]);
  return { tabs, nav, timers, go, weatherCalls: () => weatherCalls, mapCalls: () => mapCalls };
}

test('cambio tab immediato, crossfade non interattivo in uscita, nav corretta e un solo refresh Meteo', () => {
  const f = fixture(); f.go('tabForecasts');
  assert.ok(f.tabs[1].classList.contains('active'));
  assert.ok(f.tabs[1].classList.contains('is-entering'));
  assert.ok(f.tabs[0].classList.contains('is-leaving'));
  assert.ok(f.tabs[0].inert);
  assert.equal(f.nav.filter(n => n.classList.contains('active')).length, 1);
  assert.ok(f.nav[1].classList.contains('active'));
  assert.equal(f.weatherCalls(), 1);
  f.go('tabForecasts');
  assert.equal(f.weatherCalls(), 1);
  f.tabs[1].end('unrelated-child-animation');
  assert.ok(f.tabs[1].classList.contains('is-entering'));
  f.tabs[1].end('tab-enter');
  assert.equal(f.timers.size, 0);
  assert.ok(!f.tabs[0].classList.contains('is-leaving'));
  assert.ok(!f.tabs[0].inert);
  assert.equal(f.weatherCalls(), 1);
});

test('Mappa ridimensionata una sola volta dopo il fade, non mentre è nascosta', () => {
  const f = fixture(); f.go('tabRigLab'); f.tabs[2].end('tab-enter');
  f.go('tabMap');
  assert.equal(f.mapCalls(), 0);
  f.tabs[0].end('tab-fade-in');
  f.tabs[0].end('tab-fade-in');
  assert.equal(f.mapCalls(), 1);
  assert.equal(f.timers.size, 0);
});

test('navigazioni rapide annullano classi/timer precedenti senza resize nascosti o refresh doppi', () => {
  const f = fixture(); f.go('tabForecasts'); f.go('tabMap'); f.go('tabWiki');
  f.tabs[0].end('tab-fade-in'); f.tabs[1].end('tab-enter');
  assert.equal(f.mapCalls(), 0);
  assert.equal(f.weatherCalls(), 1);
  assert.equal(f.timers.size, 1);
  assert.equal(f.tabs.filter(t => t.classList.contains('active')).length, 1);
  f.tabs[3].end('tab-enter');
  assert.equal(f.timers.size, 0);
  for (const tab of f.tabs) {
    assert.ok(!tab.classList.contains('is-leaving'));
    assert.ok(!tab.classList.contains('is-entering'));
    assert.ok(!tab.inert);
  }
});

test('fallback senza animationend usa la durata CSS e completa il ritorno alla Mappa', () => {
  const f = fixture(); f.go('tabMe'); f.go('tabMap');
  const timer = [...f.timers.values()][0];
  assert.equal(timer.delay, 220);
  timer.fn();
  assert.equal(f.mapCalls(), 1);
  assert.equal(f.timers.size, 0);
});

test('reduced motion completa subito il cambio, senza timer, conservando Meteo e resize', () => {
  const f = fixture(true); f.go('tabForecasts');
  assert.equal(f.weatherCalls(), 1);
  f.go('tabMap');
  assert.equal(f.mapCalls(), 1);
  assert.equal(f.timers.size, 0);
  assert.ok(!f.tabs.some(t => t.classList.contains('is-entering') || t.classList.contains('is-leaving')));
});

test('target inesistente non cambia tab, nav o chiamate', () => {
  const f = fixture(); f.go('missing');
  assert.ok(f.tabs[0].classList.contains('active'));
  assert.ok(f.nav[0].classList.contains('active'));
  assert.equal(f.timers.size, 0);
});

test('CSS tab: ingresso/uscita brevi, Leaflet solo fade e riduzione del movimento', () => {
  assert.match(css, /--tab-transition-duration: 220ms/);
  assert.match(css, /\.tab-content\.is-leaving\s*\{[^}]*display: block;[^}]*pointer-events: none;/);
  assert.match(css, /\.tab-content\.is-entering\s*\{[^}]*animation: tab-enter/);
  assert.match(css, /#tabMap\.is-entering \{ animation-name: tab-fade-in;/);
  for (const name of ['tab-fade-in', 'tab-fade-out']) {
    const rule = css.slice(css.indexOf('@keyframes ' + name)).split('\n')[0];
    assert.doesNotMatch(rule, /transform/);
  }
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /#tabMap\.is-leaving\s*\{[^}]*animation: none;[^}]*transform: none;/);
  assert.doesNotMatch(source, /setInterval|requestAnimationFrame|MutationObserver/);
});

test('modali CSS: fade breve, chiuse non intercettano tocchi; nessuna accessibility reintrodotta', () => {
  assert.match(css, /\.modal \{[^}]*translateY\(6px\)[^}]*opacity: 0;[^}]*pointer-events: none;[^}]*220ms/);
  assert.match(css, /\.modal\.open \{[^}]*opacity: 1;[^}]*pointer-events: auto;/);
  assert.match(css, /\.import-dialog-overlay \{[^}]*visibility: hidden;[^}]*pointer-events: none;/);
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.modal, \.modal\.open,[^}]*transform: none;[^}]*transition: none;/);
  assert.doesNotMatch(html, /<script[^>]*modal-accessibility/);
});
