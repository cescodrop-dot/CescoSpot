import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);

function requestKey(request) {
  const raw = typeof request === 'string' ? request : request.url;
  const url = new URL(raw, 'https://app.test/');
  return url.pathname === '/' || url.pathname === '/index.html'
    ? './index.html'
    : `.${url.pathname}`;
}

function createWorkerHarness({ shell, network, cacheVersion = 'cescospot-v33', otherCaches = {} }) {
  const handlers = new Map();
  const stores = new Map([[cacheVersion, new Map(Object.entries(shell))]]);
  for (const [name, entries] of Object.entries(otherCaches)) {
    stores.set(name, new Map(Object.entries(entries)));
  }
  const clone = response => response.clone();

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(paths) {
          const entries = await Promise.all(paths.map(async path => {
            const response = await network({ url: new URL(path, 'https://app.test/').href, method: 'GET' });
            if (!response || !response.ok) throw new Error(`Impossibile installare ${path}`);
            return [requestKey(path), clone(response)];
          }));
          for (const [key, response] of entries) store.set(key, response);
        },
        async match(request) {
          const response = store.get(requestKey(request));
          return response && clone(response);
        },
        async put(request, response) {
          store.set(requestKey(request), clone(response));
        }
      };
    },
    async match(request) {
      for (const store of stores.values()) {
        const response = store.get(requestKey(request));
        if (response) return clone(response);
      }
      return undefined;
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };

  const self = {
    location: { origin: 'https://app.test' },
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
