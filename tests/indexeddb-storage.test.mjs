import assert from 'node:assert/strict';
import test from 'node:test';

await import('../js/data-safety.js');
await import('../js/storage-readiness.js');
await import('../js/storage.js');
globalThis.CescoStorageReadiness.finishInitialization();

function createFakeIndexedDB() {
  const records = new Map();
  const database = {
    objectStoreNames: { contains: () => true },
    createObjectStore() {},
    close() {},
    transaction() {
      const transaction = {
        error: null,
        objectStore() {
          return {
            get(key) {
              const request = {};
              queueMicrotask(() => {
                request.result = records.get(key);
                request.onsuccess?.();
              });
              return request;
            },
            put(value, key) {
              const request = {};
              queueMicrotask(() => {
                records.set(key, structuredClone(value));
                request.result = key;
                request.onsuccess?.();
                queueMicrotask(() => transaction.oncomplete?.());
              });
              return request;
            },
          };
        },
      };
      return transaction;
    },
  };

  return {
    records,
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = database;
        request.onsuccess?.();
      });
      return request;
    },
  };
}

function validSpot(id, name) {
  return { id, name, lat: 43.7, lng: 10.4, catches: [] };
}

test('migra una sola volta da localStorage e usa poi IndexedDB', async () => {
  const fakeIndexedDB = createFakeIndexedDB();
  const legacy = [validSpot('legacy-1', 'Spot storico')];
  const localRecords = new Map([['cescospot_data', JSON.stringify(legacy)]]);

  globalThis.indexedDB = fakeIndexedDB;
  globalThis.localStorage = {
    getItem: key => localRecords.get(key) ?? null,
    setItem: (key, value) => localRecords.set(key, value),
  };

  const migrated = await globalThis.loadStoredSpots();
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].name, 'Spot storico');
  assert.equal(fakeIndexedDB.records.get('spots').version, 1);
  assert.equal(fakeIndexedDB.records.get('spots').spots.length, 1);
  assert.ok(localRecords.has('cescospot_data'), 'la copia precedente resta disponibile come sicurezza');

  localRecords.set('cescospot_data', JSON.stringify([validSpot('other', 'Da ignorare')]));
  const loadedAgain = await globalThis.loadStoredSpots();
  assert.equal(loadedAgain[0].name, 'Spot storico');

  globalThis.spots = [validSpot('new-1', 'Nuovo archivio')];
  assert.equal(await globalThis.persistSpots(), true);
  assert.equal(fakeIndexedDB.records.get('spots').spots[0].name, 'Nuovo archivio');
});

test('se IndexedDB non risponde il salvataggio termina usando localStorage', async () => {
  const localRecords = new Map();
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;

  globalThis.indexedDB = { open: () => ({}) };
  globalThis.localStorage = {
    getItem: key => localRecords.get(key) ?? null,
    setItem: (key, value) => localRecords.set(key, value),
  };
  globalThis.spots = [validSpot('fallback-1', 'Fallback affidabile')];
  globalThis.setTimeout = callback => {
    queueMicrotask(callback);
    return 1;
  };
  globalThis.clearTimeout = () => {};

  try {
    assert.equal(await globalThis.persistSpots(), true);
    assert.equal(JSON.parse(localRecords.get('cescospot_data'))[0].name, 'Fallback affidabile');
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});
