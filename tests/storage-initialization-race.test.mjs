import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function deferred() {
  let resolve;
  const promise = new Promise(nextResolve => { resolve = nextResolve; });
  return { promise, resolve };
}

function extractFunction(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  const end = source.indexOf(nextSignature, start);
  assert.ok(start >= 0 && end > start, `impossibile estrarre ${signature}`);
  return source.slice(start, end);
}

async function loadReadiness() {
  const source = await read('js/storage-readiness.js');
  const context = {
    messages: [],
    alert(message) { this.messages.push(message); },
  };
  new Function('globalThis', source)(context);
  return context;
}

async function createInitializerHarness(context, loadStoredSpots) {
  const app = await read('js/app.js');
  const initializer = extractFunction(app, 'async function initializeStoredData()', '\n    initializeStoredData();');
  return new Function('loadStoredSpots', 'renderMapSpots', 'map', 'alert', 'console', 'CescoStorageReadiness', `
    let spots = [];
    ${initializer}
    return {
      initializeStoredData,
      guardedWrite(nextSpots) {
        if (!CescoStorageReadiness.ensureWriteReady()) return false;
        spots = nextSpots;
        return true;
      },
      getSpots: () => spots,
    };
  `)(loadStoredSpots, () => {}, { setView() {} }, () => {}, { warn() {} }, context.CescoStorageReadiness);
}

test('lettura lenta: una scrittura viene bloccata finché lo snapshot iniziale non è renderizzato', async () => {
  const context = await loadReadiness();
  const initialRead = deferred();
  const oldSpots = [{ id: 'old', name: 'Archivio precedente', lat: 1, lng: 1, catches: [] }];
  const newSpots = [{ id: 'new', name: 'Scrittura utente', lat: 2, lng: 2, catches: [] }];
  const app = await createInitializerHarness(context, () => initialRead.promise);

  const initialization = app.initializeStoredData();
  assert.equal(app.guardedWrite(newSpots), false);
  assert.equal(context.messages.at(-1), 'Archivio in caricamento, attendi un istante.');
  initialRead.resolve(oldSpots);
  await initialization;

  assert.deepEqual(app.getSpots(), oldSpots);
  assert.equal(context.CescoStorageReadiness.isReady(), true);
  assert.equal(app.guardedWrite(newSpots), true);
  assert.deepEqual(app.getSpots(), newSpots);
});

test('fallback localStorage: i dati caricati rendono nuovamente disponibili le scritture', async () => {
  const context = await loadReadiness();
  const fallbackSpots = [{ id: 'legacy', name: 'Archivio localStorage', lat: 1, lng: 1, catches: [] }];
  const app = await createInitializerHarness(context, async () => fallbackSpots);

  await app.initializeStoredData();

  assert.deepEqual(app.getSpots(), fallbackSpots);
  assert.equal(context.CescoStorageReadiness.isReady(), true);
  assert.equal(app.guardedWrite([{ id: 'after-fallback', name: 'Nuovo', lat: 1, lng: 1, catches: [] }]), true);
});

test('errore completo: l’inizializzazione conclude comunque la readiness', async () => {
  const context = await loadReadiness();
  const app = await createInitializerHarness(context, async () => {
    throw new Error('IndexedDB e archivio precedente non leggibili');
  });

  await app.initializeStoredData();

  assert.equal(context.CescoStorageReadiness.isReady(), true);
  assert.equal(app.guardedWrite([{ id: 'after-error', name: 'Nuovo', lat: 1, lng: 1, catches: [] }]), true);
});

test('le funzioni reali di scrittura rifiutano la chiamata programmatica prima della readiness', async () => {
  const [appSource, storageSource, quickDropSource] = await Promise.all([
    read('js/app.js'),
    read('js/storage.js'),
    read('js/quick-drop.js'),
  ]);
  const context = await loadReadiness();
  const blocked = context.CescoStorageReadiness;
  const appFunctions = [
    extractFunction(appSource, 'async function saveSpotFromModal()', '\n\n    function editSpot'),
    extractFunction(appSource, 'async function deleteSpot(id)', '\n\n    // --- GESTIONE DIARIO'),
    extractFunction(appSource, 'async function saveCatch()', '\n\n    function editCatch'),
    extractFunction(appSource, 'async function deleteCatch(spotId, catchId)', '\n\n    function renderCatchesList'),
  ];

  for (const source of appFunctions) {
    const name = source.match(/async function (\w+)/)[1];
    const fn = new Function('CescoStorageReadiness', `${source}; return ${name};`)(blocked);
    await fn();
  }

  const importAction = extractFunction(storageSource, 'async function confirmImportAction(action)', '\n\n  Object.assign');
  const importHarness = new Function('CescoStorageReadiness', 'globalScope', `
    let pendingImportData = [{ id: 'imported' }];
    let spots = [{ id: 'current' }];
    ${importAction}
    return { confirmImportAction, getSpots: () => spots };
  `)(blocked, { CescoStorageReadiness: blocked });
  await importHarness.confirmImportAction('replace');
  assert.deepEqual(importHarness.getSpots(), [{ id: 'current' }]);

  const quickDrop = extractFunction(quickDropSource, 'function quickDropSpot()', '\n    };');
  const quickDropSpot = new Function('globalScope', `${quickDrop}\n}; return quickDropSpot;`)({ CescoStorageReadiness: blocked });
  quickDropSpot();

  const persist = extractFunction(storageSource, 'async function persistSpots()', '\n\n  function exportGPX');
  const persistSpots = new Function('globalScope', `${persist}; return persistSpots;`)({ CescoStorageReadiness: blocked });
  assert.equal(await persistSpots(), false);
  assert.ok(context.messages.length >= 7);
});

test('la protezione non introduce polling', async () => {
  const source = await read('js/storage-readiness.js');
  assert.doesNotMatch(source, /setInterval|setTimeout/);
});
