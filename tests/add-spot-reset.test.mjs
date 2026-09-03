import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function extractFunction(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  const end = source.indexOf(nextSignature, start);
  assert.ok(start >= 0 && end > start, `impossibile estrarre ${signature}`);
  return source.slice(start, end);
}

function createElement(id = '') {
  const classes = new Set();
  return {
    id,
    value: '',
    innerHTML: '',
    innerText: '',
    style: {},
    dataset: {},
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: (name, force) => force ? classes.add(name) : classes.delete(name),
      contains: name => classes.has(name),
    },
  };
}

function createFormDocument() {
  const ids = [
    'modalTitle', 'tempLat', 'tempLng', 'spotName', 'spotZone', 'spotRadius', 'spotNotes',
    'spotPhotoData', 'spotPhotoInput', 'spotPhotoBox', 'techniqueSelect', 'selectedTechniquesBadges',
    'speciesSelect', 'selectedSpeciesBadges', 'customSpeciesInput', 'spotLureSelect',
    'selectedSpotLuresBadges', 'customSpotLureInput', 'waterEnvironmentBadge',
    'selectedIconLabel', 'modalAddSpot',
  ];
  const elements = new Map(ids.map(id => [id, createElement(id)]));
  const colors = ['#22c55e', '#eab308'].map(color => {
    const element = createElement();
    element.dataset.color = color;
    return element;
  });
  const icons = ['📍', '🐟'].map(icon => {
    const element = createElement();
    element.dataset.icon = icon;
    return element;
  });

  return {
    getElementById: id => elements.get(id),
    querySelectorAll: selector => selector === '.color-opt' ? colors : selector === '.icon-card' ? icons : [],
    querySelector: selector => colors.find(color => selector.includes(color.dataset.color)) || null,
    elements,
    colors,
    icons,
  };
}

async function createHarness() {
  const source = await read('js/app.js');
  const renderTechnique = extractFunction(source, 'function renderTechniqueSelect(selectedList = [])', '\n\n    function selectTechnique');
  const renderSpecies = extractFunction(source, 'function renderSpeciesSelector(selectedList = [])', '\n\n    function selectSpecies');
  const renderLures = extractFunction(source, 'function renderSpotLureSelect(selectedList = [])', '\n\n    function selectSpotLure');
  const selectColor = extractFunction(source, 'function selectColor(colorHex, el)', '\n\n    function shareSpot');
  const resetStart = source.indexOf('function resetAddSpotFormState()');
  const reset = resetStart >= 0 ? extractFunction(source, 'function resetAddSpotFormState()', '\n\n    function openAddSpotModal') : '';
  const localityStart = source.indexOf('function resolveAddSpotLocality(');
  const locality = localityStart >= 0 ? extractFunction(source, 'function resolveAddSpotLocality(', '\n\n    function openAddSpotModal') : '';
  const open = extractFunction(source, 'function openAddSpotModal(lat, lng)', '\n\n    function closeModals');
  const edit = extractFunction(source, 'function editSpot(id)', '\n\n    async function deleteSpot');
  const startFromMap = extractFunction(source, 'function startSpotFromMap({ lat, lng })', '\n\n    // The map module');
  const document = createFormDocument();

  return new Function('document', `
    const freshwaterSpecies = ['Trota'];
    const saltwaterSpecies = ['Spigola'];
    const allTechniques = ['Spinning'];
    const allLures = ['Minnow'];
    const iconList = [{ id: '📍', type: 'emoji', name: 'Pin Esatto' }, { id: '🐟', type: 'emoji', name: 'Pesce / Spot' }];
    const DEFAULT_SPOT_COLOR = '#22c55e';
    const DEFAULT_SPOT_ICON = iconList[0];
    let currentEnvironmentSpecies = freshwaterSpecies;
    let selectedTechniquesSet = new Set();
    let selectedSpeciesSet = new Set();
    let selectedSpotLuresSet = new Set();
    let selectedColor = '#22c55e';
    let selectedIcon = '📍';
    let selectedIconType = 'emoji';
    let editingSpotId = null;
    let addSpotLocalityGeneration = 0;
    let spots = [];
    const map = { getCenter: () => ({ lat: 41.9, lng: 12.5 }), removeLayer() {} };
    const L = {
      latLng: (lat, lng) => ({ lat, lng }),
      divIcon: options => options,
      marker: latLng => ({ latLng, addTo: () => ({ latLng }) }),
    };
    const reverseRequests = [];
    const fetch = url => new Promise((resolve, reject) => reverseRequests.push({ url, resolve, reject }));
    let tempMarker = null;
    const escapeHtml = value => value;
    const encodeInlineValue = value => value;
    ${renderTechnique}
    ${renderSpecies}
    ${renderLures}
    ${selectColor}
    ${locality}
    ${reset}
    ${open}
    ${startFromMap}
    function detectWaterEnvironment(lat, lng, zone) {
      currentEnvironmentSpecies = zone.includes('Mare') ? saltwaterSpecies : freshwaterSpecies;
      document.getElementById('waterEnvironmentBadge').innerText = currentEnvironmentSpecies === saltwaterSpecies ? 'Acqua Salata (Mare)' : 'Acqua Dolce (Fiume/Lago)';
      renderSpeciesSelector(Array.from(selectedSpeciesSet));
    }
    function removePhoto(hiddenInputId, previewBoxId) {
      document.getElementById(hiddenInputId).value = '';
      document.getElementById(previewBoxId).innerHTML = '<i class="fa-solid fa-camera"></i>';
    }
    ${edit}
    return {
      open: openAddSpotModal,
      startFromMap: startSpotFromMap,
      edit: editSpot,
      setSpot: spot => { spots = [spot]; },
      reverseRequests,
      stale() {
        editingSpotId = 'edited';
        selectedTechniquesSet = new Set(['Spinning']);
        selectedSpeciesSet = new Set(['Spigola', 'Specie locale']);
        selectedSpotLuresSet = new Set(['Minnow', 'Esca locale']);
        currentEnvironmentSpecies = saltwaterSpecies;
        selectedColor = '#eab308';
        selectedIcon = '🐟';
        selectedIconType = 'emoji';
        document.getElementById('spotPhotoData').value = 'data:image/jpeg;base64,OLD';
        document.getElementById('spotPhotoInput').value = 'old.jpg';
        document.getElementById('spotPhotoBox').innerHTML = '<img src="old.jpg">';
        document.getElementById('selectedTechniquesBadges').innerHTML = 'Spinning';
        document.getElementById('selectedSpeciesBadges').innerHTML = 'Spigola, Specie locale';
        document.getElementById('selectedSpotLuresBadges').innerHTML = 'Minnow, Esca locale';
        document.getElementById('customSpeciesInput').value = 'Specie locale';
        document.getElementById('customSpotLureInput').value = 'Esca locale';
        document.getElementById('waterEnvironmentBadge').innerText = 'Acqua Salata (Mare)';
        document.getElementById('selectedIconLabel').innerText = 'Pesce / Spot';
        document.querySelectorAll('.color-opt')[1].classList.add('selected');
        document.querySelectorAll('.icon-card')[1].classList.add('selected');
      },
      snapshot() {
        return {
          editingSpotId,
          name: document.getElementById('spotName').value,
          zone: document.getElementById('spotZone').value,
          radius: document.getElementById('spotRadius').value,
          notes: document.getElementById('spotNotes').value,
          techniques: [...selectedTechniquesSet], species: [...selectedSpeciesSet], lures: [...selectedSpotLuresSet],
          environment: currentEnvironmentSpecies === freshwaterSpecies ? 'freshwater' : 'saltwater',
          color: selectedColor, icon: selectedIcon, iconType: selectedIconType,
          photo: document.getElementById('spotPhotoData').value,
          photoInput: document.getElementById('spotPhotoInput').value,
          photoBox: document.getElementById('spotPhotoBox').innerHTML,
          techniqueBadges: document.getElementById('selectedTechniquesBadges').innerHTML,
          speciesBadges: document.getElementById('selectedSpeciesBadges').innerHTML,
          lureBadges: document.getElementById('selectedSpotLuresBadges').innerHTML,
          customSpecies: document.getElementById('customSpeciesInput').value,
          customLure: document.getElementById('customSpotLureInput').value,
          waterBadge: document.getElementById('waterEnvironmentBadge').innerText,
          iconLabel: document.getElementById('selectedIconLabel').innerText,
          defaultColorSelected: document.querySelectorAll('.color-opt')[0].classList.contains('selected'),
          defaultIconSelected: document.querySelectorAll('.icon-card')[0].classList.contains('selected'),
          coordinates: [document.getElementById('tempLat').value, document.getElementById('tempLng').value],
        };
      },
    };
  `)(document);
}

test('un nuovo Add Spot pulisce completamente il DOM e lo stato dell’editing precedente', async () => {
  const app = await createHarness();
  app.stale();
  app.open();
  const state = app.snapshot();

  assert.equal(state.editingSpotId, null);
  assert.deepEqual(state.techniques, []);
  assert.deepEqual(state.species, []);
  assert.deepEqual(state.lures, []);
  assert.equal(state.environment, 'freshwater');
  assert.equal(state.color, '#22c55e');
  assert.equal(state.icon, '📍');
  assert.equal(state.photo, '');
  assert.equal(state.photoInput, '');
  assert.match(state.photoBox, /fa-camera/);
  assert.equal(state.techniqueBadges, '');
  assert.equal(state.speciesBadges, '');
  assert.equal(state.lureBadges, '');
  assert.equal(state.customSpecies, '');
  assert.equal(state.customLure, '');
  assert.equal(state.waterBadge, 'Acqua Dolce');
  assert.equal(state.iconLabel, 'Pin Esatto');
  assert.equal(state.defaultColorSelected, true);
  assert.equal(state.defaultIconSelected, true);
  assert.deepEqual(state.coordinates, [41.9, 12.5]);
});

test('l’editing conserva lo stato dello spot e il nuovo Add Spot riparte pulito anche con coordinate mappa', async () => {
  const app = await createHarness();
  app.setSpot({
    id: 'sea-spot', name: 'Scogliera', zone: 'Mare aperto', radius: 70, notes: 'Marea',
    techniques: ['Spinning'], targets: ['Spigola'], spotLures: ['Minnow'],
    photo: 'data:image/jpeg;base64,EDIT', color: '#eab308', icon: '🐟', lat: 43.5, lng: 10.2,
  });

  app.edit('sea-spot');
  const editing = app.snapshot();
  assert.equal(editing.editingSpotId, 'sea-spot');
  assert.equal(editing.name, 'Scogliera');
  assert.equal(editing.zone, 'Mare aperto');
  assert.equal(editing.radius, 70);
  assert.equal(editing.notes, 'Marea');
  assert.deepEqual(editing.techniques, ['Spinning']);
  assert.deepEqual(editing.species, ['Spigola']);
  assert.deepEqual(editing.lures, ['Minnow']);
  assert.equal(editing.photo, 'data:image/jpeg;base64,EDIT');
  assert.equal(editing.color, '#eab308');
  assert.equal(editing.icon, '🐟');
  assert.equal(editing.environment, 'saltwater');

  app.startFromMap({ lat: 43.6, lng: 10.3 });
  const fresh = app.snapshot();
  assert.equal(fresh.editingSpotId, null);
  assert.equal(fresh.photo, '');
  assert.equal(fresh.color, '#22c55e');
  assert.equal(fresh.icon, '📍');
  assert.equal(fresh.environment, 'freshwater');
  assert.deepEqual(fresh.coordinates, [43.6, 10.3]);
  assert.equal(app.reverseRequests.length, 1);
  assert.match(app.reverseRequests[0].url, /lat=43\.6.*lon=10\.3/);
});

test('un Add Spot aperto su coordinate reali risolve la località senza ritardare la modale', async () => {
  const app = await createHarness();
  const openedAt = Date.now();
  app.open(43.7, 10.4);

  assert.ok(Date.now() - openedAt < 100, 'l’apertura deve essere sincrona');
  assert.equal(app.snapshot().zone, 'Generale');
  assert.equal(app.reverseRequests.length, 1);
  assert.match(app.reverseRequests[0].url, /reverse\?format=json.*lat=43\.7.*lon=10\.4/);

  app.reverseRequests[0].resolve({
    ok: true,
    json: async () => ({ address: { municipality: 'Pisa' } }),
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.snapshot().zone, 'Pisa');
});

test('una risposta reverse geocoding vecchia non sovrascrive la modale aperta dopo', async () => {
  const app = await createHarness();
  app.open(43.7, 10.4);
  app.open(44.5, 11.3);
  assert.equal(app.reverseRequests.length, 2);

  app.reverseRequests[1].resolve({ ok: true, json: async () => ({ address: { town: 'Bologna' } }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.snapshot().zone, 'Bologna');

  app.reverseRequests[0].resolve({ ok: true, json: async () => ({ address: { town: 'Pisa' } }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.snapshot().zone, 'Bologna');
});

test('il reverse geocoding fallito o incompleto lascia il fallback Generale utilizzabile', async () => {
  const app = await createHarness();
  app.open(43.7, 10.4);
  app.reverseRequests[0].reject(new Error('offline'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.snapshot().zone, 'Generale');

  app.open(44.5, 11.3);
  app.reverseRequests[1].resolve({ ok: true, json: async () => ({ address: {} }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.snapshot().zone, 'Generale');
});

test('un Add Spot senza coordinate usa il centro mappa corrente per la richiesta locale', async () => {
  const app = await createHarness();
  app.open();
  assert.equal(app.snapshot().coordinates[0], 41.9);
  assert.equal(app.snapshot().coordinates[1], 12.5);
  assert.match(app.reverseRequests[0].url, /lat=41\.9.*lon=12\.5/);
});
