import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);

function requestKey(request, baseUrl) {
  const raw = typeof request === 'string' ? request : request.url;
  return new URL(raw, baseUrl).href;
}

function createWorkerHarness({
  shell,
  network,
  cacheVersion = 'cescospot-v34',
  otherCaches = {},
  scope = 'https://app.test/'
}) {
  const handlers = new Map();
  const toStore = entries => new Map(Object.entries(entries).map(([key, response]) => [requestKey(key, scope), response]));
  const stores = new Map([[cacheVersion, toStore(shell)]]);
  for (const [name, entries] of Object.entries(otherCaches)) {
    stores.set(name, toStore(entries));
  }
  const clone = response => response.clone();

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(paths) {
          const entries = await Promise.all(paths.map(async path => {
            const response = await network({ url: new URL(path, scope).href, method: 'GET' });
            if (!response || !response.ok) throw new Error(`Impossibile installare ${path}`);
            return [requestKey(path, scope), clone(response)];
          }));
          for (const [key, response] of entries) store.set(key, response);
        },
        async match(request) {
          const response = store.get(requestKey(request, scope));
          return response && clone(response);
        },
        async put(request, response) {
          store.set(requestKey(request, scope), clone(response));
        }
      };
    },
    async match(request) {
      for (const store of stores.values()) {
        const response = store.get(requestKey(request, scope));
        if (response) return clone(response);
      }
      return undefined;
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };

  const self = {
    location: { origin: new URL(scope).origin, href: new URL('sw.js', scope).href },
    registration: { scope },
    addEventListener(type, handler) { handlers.set(type, handler); },
    skipWaiting() { return Promise.resolve(); },
    clients: { claim() { return Promise.resolve(); } }
  };

  const context = vm.createContext({
    self,
    caches,
    fetch: request => network(request),
    URL,
    Response,
    Headers,
    Promise,
    console
  });

  async function dispatch(type, request) {
    let responsePromise;
    const pending = [];
    handlers.get(type)({
      request,
      respondWith(value) { responsePromise = Promise.resolve(value); },
      waitUntil(value) { pending.push(Promise.resolve(value)); }
    });
    await Promise.all(pending);
    return responsePromise || (request && network(request));
  }

  return { context, dispatch, stores };
}

async function loadWorker(harness, cacheVersion) {
  let source = await readFile(new URL('sw.js', root), 'utf8');
  if (cacheVersion) {
    source = source.replace(/const CACHE_VERSION = 'cescospot-v\d+';/, `const CACHE_VERSION = '${cacheVersion}';`);
  }
  vm.runInContext(source, harness.context, { filename: 'sw.js' });
}

test('un worker attivo serve una shell coerente anche quando la rete ha gia la V2', async () => {
  const cacheVersion = 'cescospot-v1';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: {
      './index.html': new Response('<html>INDEX-V1</html>'),
      './js/app.js': new Response('APP-V1'),
      './styles/app.css': new Response('CSS-V1')
    },
    network: request => {
      const path = new URL(request.url, 'https://app.test/').pathname;
      const version = path === '/' ? 'INDEX-V2' : path.includes('app.js') ? 'APP-V2' : 'CSS-V2';
      return Promise.resolve(new Response(version));
    }
  });
  await loadWorker(harness, cacheVersion);

  const index = await harness.dispatch('fetch', { url: 'https://app.test/', method: 'GET', mode: 'navigate' });
  const app = await harness.dispatch('fetch', { url: 'https://app.test/js/app.js', method: 'GET', mode: 'cors' });
  const css = await harness.dispatch('fetch', { url: 'https://app.test/styles/app.css', method: 'GET', mode: 'cors' });

  assert.match(await index.text(), /INDEX-V1/);
  assert.equal(await app.text(), 'APP-V1');
  assert.equal(await css.text(), 'CSS-V1');
});

test('una shell cached resta disponibile offline', async () => {
  const cacheVersion = 'cescospot-v1';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: {
      './index.html': new Response('<html>INDEX-V1</html>'),
      './js/app.js': new Response('APP-V1'),
      './styles/app.css': new Response('CSS-V1')
    },
    network: () => Promise.reject(new Error('offline'))
  });
  await loadWorker(harness, cacheVersion);

  const index = await harness.dispatch('fetch', { url: 'https://app.test/', method: 'GET', mode: 'navigate' });
  const app = await harness.dispatch('fetch', { url: 'https://app.test/js/app.js', method: 'GET', mode: 'cors' });

  assert.match(await index.text(), /INDEX-V1/);
  assert.equal(await app.text(), 'APP-V1');
});

for (const scope of ['https://app.test/', 'https://app.test/CescoSpot/']) {
  test(`la navigation shell in ${scope} mantiene un viewport zoomabile`, async () => {
    const cacheVersion = 'cescospot-v1';
    const harness = createWorkerHarness({
      cacheVersion,
      scope,
      shell: {
        './index.html': new Response('<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"></head></html>')
      },
      network: () => Promise.reject(new Error('offline'))
    });
    await loadWorker(harness, cacheVersion);

    const response = await harness.dispatch('fetch', { url: scope, method: 'GET', mode: 'navigate' });
    const body = await response.text();
    assert.doesNotMatch(body, /maximum-scale=1(?:\.0)?/);
    assert.doesNotMatch(body, /user-scalable=no/);
    assert.match(body, /width=device-width/);
    assert.match(body, /initial-scale=1\.0/);
    assert.match(body, /viewport-fit=cover/);
  });
}

test('sotto il sottopercorso GitHub Pages il JS shell viene riconosciuto e servito offline', async () => {
  const cacheVersion = 'cescospot-v1';
  const scope = 'https://app.test/CescoSpot/';
  const harness = createWorkerHarness({
    cacheVersion,
    scope,
    shell: {
      './index.html': new Response('<html>INDEX-V1</html>'),
      './js/app.js': new Response('APP-V1')
    },
    network: () => Promise.reject(new Error('offline'))
  });
  await loadWorker(harness, cacheVersion);

  const app = await harness.dispatch('fetch', {
    url: 'https://app.test/CescoSpot/js/app.js',
    method: 'GET',
    mode: 'cors'
  });

  assert.equal(await app.text(), 'APP-V1');
});

test('sotto il sottopercorso navigation, CSS, moduli, vendor e immagini shell restano disponibili offline', async () => {
  const cacheVersion = 'cescospot-v1';
  const scope = 'https://app.test/CescoSpot/';
  const harness = createWorkerHarness({
    cacheVersion,
    scope,
    shell: {
      './index.html': new Response('<html>INDEX-V1</html>'),
      './styles/app.css': new Response('CSS-V1'),
      './js/storage.js': new Response('STORAGE-V1'),
      './vendor/leaflet/leaflet.js': new Response('LEAFLET-V1'),
      './vendor/fontawesome/webfonts/fa-solid-900.woff2': new Response('FONT-V1'),
      './assets/images/app/map.png': new Response('IMAGE-V1')
    },
    network: () => Promise.reject(new Error('offline'))
  });
  await loadWorker(harness, cacheVersion);

  const requests = [
    ['https://app.test/CescoSpot/', 'navigate', /INDEX-V1/],
    ['https://app.test/CescoSpot/styles/app.css', 'cors', 'CSS-V1'],
    ['https://app.test/CescoSpot/js/storage.js', 'cors', 'STORAGE-V1'],
    ['https://app.test/CescoSpot/vendor/leaflet/leaflet.js', 'cors', 'LEAFLET-V1'],
    ['https://app.test/CescoSpot/vendor/fontawesome/webfonts/fa-solid-900.woff2', 'cors', 'FONT-V1'],
    ['https://app.test/CescoSpot/assets/images/app/map.png', 'cors', 'IMAGE-V1']
  ];

  for (const [url, mode, expected] of requests) {
    const response = await harness.dispatch('fetch', { url, method: 'GET', mode });
    const body = await response.text();
    expected instanceof RegExp ? assert.match(body, expected) : assert.equal(body, expected);
  }
});

test('un URL same-origin fuori scope non viene scambiato per asset della shell', async () => {
  let networkCalls = 0;
  const harness = createWorkerHarness({
    scope: 'https://app.test/CescoSpot/',
    shell: { './js/app.js': new Response('APP-SCOPE') },
    network: () => {
      networkCalls += 1;
      return Promise.resolve(new Response('OUT-OF-SCOPE'));
    }
  });
  await loadWorker(harness);

  const response = await harness.dispatch('fetch', {
    url: 'https://app.test/js/app.js',
    method: 'GET',
    mode: 'cors'
  });
  assert.equal(await response.text(), 'OUT-OF-SCOPE');
  assert.equal(networkCalls, 1);
});

test('cache.addAll risolve gli asset shell rispetto allo scope del worker', async () => {
  const scope = 'https://app.test/CescoSpot/';
  const seenUrls = [];
  const harness = createWorkerHarness({
    scope,
    shell: {},
    network: request => {
      seenUrls.push(request.url);
      return Promise.resolve(new Response('SHELL-V2'));
    }
  });
  await loadWorker(harness);

  await harness.dispatch('install');
  assert.ok(seenUrls.includes('https://app.test/CescoSpot/js/app.js'));
  assert.ok(seenUrls.includes('https://app.test/CescoSpot/styles/app.css'));
  assert.equal(seenUrls.some(url => url === 'https://app.test/js/app.js'), false);
});

test('le API remote non vengono lette dalla cache shell', async () => {
  let called = false;
  const harness = createWorkerHarness({
    shell: { './index.html': new Response('<html>INDEX-V1</html>') },
    network: () => { called = true; return Promise.resolve(new Response('REMOTE')); }
  });
  await loadWorker(harness);

  const response = await harness.dispatch('fetch', { url: 'https://api.open-meteo.com/v1/forecast', method: 'GET', mode: 'cors' });
  assert.equal(await response.text(), 'REMOTE');
  assert.equal(called, true);
});

test('un worker nuovo usa soltanto la propria shell V2', async () => {
  const cacheVersion = 'cescospot-v2';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: {
      './index.html': new Response('<html>INDEX-V2</html>'),
      './js/app.js': new Response('APP-V2'),
      './styles/app.css': new Response('CSS-V2')
    },
    network: () => Promise.reject(new Error('la shell non deve usare la rete'))
  });
  await loadWorker(harness, cacheVersion);

  const index = await harness.dispatch('fetch', { url: 'https://app.test/', method: 'GET', mode: 'navigate' });
  const app = await harness.dispatch('fetch', { url: 'https://app.test/js/app.js', method: 'GET', mode: 'cors' });
  const css = await harness.dispatch('fetch', { url: 'https://app.test/styles/app.css', method: 'GET', mode: 'cors' });

  assert.match(await index.text(), /INDEX-V2/);
  assert.equal(await app.text(), 'APP-V2');
  assert.equal(await css.text(), 'CSS-V2');
});

test('un asset essenziale assente non viene prelevato dalla rete di una versione diversa', async () => {
  const cacheVersion = 'cescospot-v1';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: { './index.html': new Response('<html>INDEX-V1</html>') },
    network: () => Promise.resolve(new Response('APP-V2'))
  });
  await loadWorker(harness, cacheVersion);

  const app = await harness.dispatch('fetch', { url: 'https://app.test/js/app.js', method: 'GET', mode: 'cors' });
  assert.equal(app.status, 503);
});

test('una navigazione senza shell cached fallisce in modo esplicito senza richiedere HTML di un altra versione', async () => {
  const cacheVersion = 'cescospot-v1';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: {},
    network: () => Promise.resolve(new Response('<html>INDEX-V2</html>'))
  });
  await loadWorker(harness, cacheVersion);

  const index = await harness.dispatch('fetch', { url: 'https://app.test/', method: 'GET', mode: 'navigate' });
  assert.equal(index.status, 503);
});

test('l installazione non lascia una cache parziale se un asset shell fallisce', async () => {
  const cacheVersion = 'cescospot-v2';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: {},
    network: request => {
      const path = new URL(request.url).pathname;
      return path.endsWith('/js/app.js')
        ? Promise.reject(new Error('download interrotto'))
        : Promise.resolve(new Response(`V2 ${path}`));
    }
  });
  await loadWorker(harness, cacheVersion);

  await assert.rejects(harness.dispatch('install'));
  assert.equal(harness.stores.get(cacheVersion).size, 0);
});

test('la cache V1 resta finche V2 non viene attivata, poi viene eliminata', async () => {
  const cacheVersion = 'cescospot-v2';
  const harness = createWorkerHarness({
    cacheVersion,
    shell: { './index.html': new Response('<html>INDEX-V2</html>') },
    otherCaches: { 'cescospot-v1': { './index.html': new Response('<html>INDEX-V1</html>') } },
    network: () => Promise.resolve(new Response('V2'))
  });
  await loadWorker(harness, cacheVersion);

  assert.equal(harness.stores.has('cescospot-v1'), true);
  await harness.dispatch('activate');
  assert.equal(harness.stores.has('cescospot-v1'), false);
  assert.equal(harness.stores.has(cacheVersion), true);
});
