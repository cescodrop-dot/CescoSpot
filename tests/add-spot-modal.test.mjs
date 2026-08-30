import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('js/app.js');
const html = read('index.html');
// Execute the production declarations, not copies or an alternative spot flow.
const formFunctions = app.slice(app.indexOf('const allTechniques ='), app.indexOf('function toggleMapSearch()'));
const openingFunction = app.slice(app.indexOf('function openAddSpotModal('), app.indexOf('async function saveSpotFromModal()'));
const blueButtonAction = html.match(/class="fab-add"[^>]*onclick="([^"]+)"/)[1];

function harness({ accessibility = true, fetchImpl = () => new Promise(() => {}), loading = false } = {}) {
  const records = [];
  const frames = [];
  const writes = [];
  const listeners = new Map();
  let observer;
  let options;
  let document;
  const ids = new Map();
  function mutate(target, type, attributeName) {
    writes.push(`${target.id || target.tagName}:${attributeName || type}`);
    if (!observer || !options.subtree || !document.body.contains(target)) return;
    if (type === 'attributes' && (!options.attributes || !options.attributeFilter.includes(attributeName))) return;
    if (type === 'childList' && !options.childList) return;
    records.push({ target, type, attributeName, addedNodes: [] });
  }
  class Element {
    constructor(tagName, id = '', classes = []) {
      this.tagName = tagName;
      this.id = id;
      this.attrs = new Map();
      this.classes = new Set(classes);
      this.children = [];
      this.value = '';
      this.hidden = false;
      this.isConnected = true;
      this.style = new Proxy({}, { set: (object, key, value) => {
        object[key] = value;
        mutate(this, 'attributes', 'style');
        return true;
      } });
      this.classList = {
        contains: value => this.classes.has(value),
        add: value => { this.classes.add(value); mutate(this, 'attributes', 'class'); },
        remove: value => { this.classes.delete(value); mutate(this, 'attributes', 'class'); }
      };
      if (id) ids.set(id, this);
    }
    append(child) { child.parentElement = this; this.children.push(child); return child; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    hasAttribute(name) { return this.attrs.has(name); }
    setAttribute(name, value) {
      // Real DOM queues an attribute mutation even when the value is unchanged.
      this.attrs.set(name, String(value));
      mutate(this, 'attributes', name);
    }
    set innerHTML(value) { this.html = value; mutate(this, 'childList'); }
    get innerHTML() { return this.html || ''; }
    set innerText(value) { this.text = value; mutate(this, 'childList'); }
    matches(selector) {
      if (selector === '.modal' || selector.includes('.modal-overlay')) return this.classes.has('modal');
      if (selector.includes('button:not')) return ['button', 'input', 'select', 'textarea'].includes(this.tagName) && this.getAttribute('type') !== 'hidden';
      if (selector.includes('h1,')) return /^h[1-6]$/.test(this.tagName) && selector.includes(this.tagName);
      if (selector.includes('data-modal-close')) return this.id === 'closeSpot';
      return false;
    }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() { document.activeElement = this; }
    click() { if (this.id === 'closeSpot') vm.runInContext('closeModals()', context); }
  }
  const body = new Element('body');
  const opener = body.append(new Element('button', 'blueButton'));
  const modal = body.append(new Element('div', 'modalAddSpot', ['modal']));
  const close = modal.append(new Element('button', 'closeSpot'));
  const fieldIds = ['modalTitle', 'tempLat', 'tempLng', 'spotName', 'spotZone', 'spotRadius', 'spotNotes', 'spotPhotoData', 'spotPhotoBox', 'techniqueSelect', 'selectedTechniquesBadges', 'speciesSelect', 'selectedSpeciesBadges', 'spotLureSelect', 'selectedSpotLuresBadges', 'waterEnvironmentBadge'];
  for (const id of fieldIds) {
    assert.ok(html.includes(`id="${id}"`), `${id} exists in production HTML`);
    const tag = id === 'modalTitle' ? 'h4' : id.endsWith('Select') ? 'select' : id.endsWith('Box') || id.endsWith('Badges') || id.endsWith('Badge') ? 'div' : 'input';
    const field = modal.append(new Element(tag, id));
    if (['tempLat', 'tempLng', 'spotPhotoData'].includes(id)) field.setAttribute('type', 'hidden');
  }
  document = {
    body, activeElement: opener, readyState: loading ? 'loading' : 'complete',
    getElementById: id => ids.get(id) || null,
    querySelectorAll: selector => body.querySelectorAll(selector),
    addEventListener: (event, callback) => listeners.set(event, callback)
  };
  const warnings = [];
  const context = vm.createContext({
    document, Element, HTMLElement: Element,
    console: { warn: (...args) => warnings.push(args) },
    map: { getCenter: () => ({ lat: 41.9, lng: 12.5 }), removeLayer() {} },
    editingSpotId: 'old-edit', tempMarker: null,
    fetch: fetchImpl,
    requestAnimationFrame: callback => frames.push(callback),
    getComputedStyle: element => ({
      display: element.style.display || 'block', opacity: element.style.opacity || '1',
      visibility: element.style.visibility || (element === modal && !modal.classList.contains('open') ? 'hidden' : 'visible')
    }),
    MutationObserver: class {
      constructor(callback) { this.callback = callback; }
      observe(target, config) { observer = this; options = config; }
    }
  });
  vm.runInContext(read('js/data-safety.js'), context);
  vm.runInContext(formFunctions + '\n' + openingFunction, context, { filename: 'app.js:AddSpot' });
  if (accessibility) vm.runInContext(read('js/modal-accessibility.js'), context);
  if (loading) listeners.get('DOMContentLoaded')?.();
  function settle() {
    let deliveries = 0;
    while (records.length) {
      assert.ok(++deliveries <= 20, `MutationObserver does not settle: ${writes.slice(-8).join(', ')}`);
      observer.callback(records.splice(0));
    }
    frames.splice(0).forEach(callback => callback());
    return deliveries;
  }
  return { context, modal, ids, close, opener, document, warnings, settle,
    open: () => vm.runInContext(blueButtonAction, context),
    key: key => listeners.get('keydown')?.({ key, preventDefault() {}, stopPropagation() {} }) };
}

test('real blue onclick/openAddSpotModal: form reset, observer settles, focus and Escape recover', () => {
  const h = harness({ loading: true });
  assert.equal(typeof h.context.openAddSpotModal, 'function');
  h.open();
  assert.equal(h.context.editingSpotId, null);
  assert.equal(h.ids.get('tempLat').value, 41.9);
  assert.equal(h.ids.get('tempLng').value, 12.5);
  assert.equal(h.modal.classList.contains('open'), true);
  h.settle();
  assert.equal(h.modal.getAttribute('aria-hidden'), 'false');
  assert.equal(h.document.activeElement, h.close);
  assert.ok(h.ids.get('techniqueSelect').innerHTML.includes('Spinning'));
  assert.ok(h.ids.get('speciesSelect').innerHTML.includes('Carpa'));
  assert.ok(h.ids.get('spotLureSelect').innerHTML.includes('Minnow'));
  h.key('Escape');
  h.settle();
  assert.equal(h.modal.classList.contains('open'), false);
  assert.equal(h.document.activeElement, h.opener);
  h.open();
  h.settle();
  assert.equal(h.modal.getAttribute('aria-hidden'), 'false');
});

for (const helper of ['removePhoto', 'renderTechniqueSelect', 'renderSpeciesSelector', 'renderSpotLureSelect']) {
  test(`actual openAddSpotModal still opens when ${helper} throws`, () => {
    const h = harness();
    h.context[helper] = () => { throw new Error(`broken ${helper}`); };
    assert.doesNotThrow(h.open);
    h.settle();
    assert.equal(h.modal.classList.contains('open'), true);
    assert.equal(h.modal.getAttribute('aria-hidden'), 'false');
    assert.ok(h.warnings.length > 0);
  });
}

test('opening does not wait for geocoding or require accessibility', () => {
  const h = harness({ accessibility: false });
  h.open();
  assert.equal(h.modal.classList.contains('open'), true);
  assert.equal(h.ids.get('spotName').value, '');
});

test('a missing optional global does not prevent base dialog opening', () => {
  const h = harness();
  h.context.removePhoto = undefined;
  assert.doesNotThrow(h.open);
  h.settle();
  assert.equal(h.modal.getAttribute('aria-hidden'), 'false');
  assert.equal(h.warnings.length, 1);
});

test('opening during visibility transition activates focus without an ARIA feedback loop', () => {
  const h = harness();
  h.modal.style.visibility = 'hidden'; // The old CSS value can persist at transition start.
  h.open();
  h.settle();
  assert.equal(h.modal.getAttribute('aria-hidden'), 'false');
  h.modal.style.visibility = 'visible';
  h.settle();
  assert.equal(h.document.activeElement, h.close);
  // Subsequent form rendering must not repeatedly refocus or enqueue ARIA work.
  h.ids.get('spotName').focus();
  h.ids.get('selectedSpeciesBadges').innerHTML = '<span>Carpa</span>';
  assert.ok(h.settle() <= 1);
  assert.equal(h.document.activeElement, h.ids.get('spotName'));
});

test('zero coordinates are preserved by the production opening function', () => {
  const h = harness();
  vm.runInContext('openAddSpotModal(0, 0)', h.context);
  h.settle();
  assert.equal(h.ids.get('tempLat').value, 0);
  assert.equal(h.ids.get('tempLng').value, 0);
});

test('actual environment detection and selector rendering settle after a geocoding response', async () => {
  const h = harness({ fetchImpl: async () => ({ ok: true, json: async () => ({ address: { city: 'Marina', state: 'Test' } }) }) });
  h.open();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  h.settle();
  assert.equal(h.ids.get('spotZone').value, 'Marina, Test');
  assert.ok(h.ids.get('speciesSelect').innerHTML.includes('Orata'));
  assert.equal(h.modal.getAttribute('aria-hidden'), 'false');
});

test('synchronous fetch failure and failed environment detection cannot block opening', async () => {
  const h = harness({ fetchImpl: () => { throw new Error('network unavailable'); } });
  h.context.detectWaterEnvironment = () => { throw new Error('environment unavailable'); };
  assert.doesNotThrow(h.open);
  for (let i = 0; i < 10; i++) await Promise.resolve();
  h.settle();
  assert.equal(h.modal.classList.contains('open'), true);
});
