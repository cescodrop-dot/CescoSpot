const CACHE_VERSION = 'cescospot-v35';
const APP_SHELL = [
  './',
  './index.html',
  './styles/app.css',
  './styles/mobile-polish.css',
  './styles/weather-insights.css',
  './js/manifest.js',
  './js/data-safety.js',
  './js/storage-readiness.js',
  './js/storage.js',
  './js/map-tap.js',
  './js/app.js',
  './js/quick-drop.js',
  './js/river-status.js',
  './js/map-providers.js',
  './js/weather-insights.js',
  './js/wiki-images.js',
  './js/photo-upload.js',
  './js/lightbox.js',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet/LICENSE',
  './vendor/suncalc.js',
  './vendor/fontawesome/css/all.min.css',
  './vendor/fontawesome/webfonts/fa-solid-900.woff2',
  './vendor/fontawesome/webfonts/fa-regular-400.woff2',
  './assets/images/app/map.png',
  './assets/images/rigs/palomar.jpg',
  './assets/images/rigs/clinch.jpg',
  './assets/images/rigs/fg_knot.jpg',
  './assets/images/rigs/albright.jpg',
  './assets/images/rigs/rapala.jpg',
  './assets/images/rigs/spallinata_aperta.jpg',
  './assets/images/rigs/spallinata_chiusa.jpg',
  './assets/images/rigs/corona_tocco.jpg',
  './assets/images/rigs/galleggiante_scorr.jpg',
  './assets/images/rigs/running_rig.jpg',
  './assets/images/rigs/paternoster.jpg',
  './assets/images/rigs/method_feeder.jpg',
  './assets/images/rigs/jig_head.jpg',
  './assets/images/rigs/drop_shot.jpg',
  './wiki/uni_paletta.svg',
  './wiki/texas_rig.svg'
];

const LOCKED_VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">';
const APP_SHELL_URLS = APP_SHELL.map(path => new URL(path, self.registration.scope).href);

async function withLockedViewport(response) {
  if (!response) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  const html = await response.text();
  const lockedHtml = html.replace(/<meta\s+name=["']viewport["']\s+content=["'][^"']*["']\s*\/?\s*>/i, LOCKED_VIEWPORT);
  return new Response(lockedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
  );
});

function isShellAsset(requestUrl) {
  return APP_SHELL_URLS.includes(requestUrl.href);
}

function fromActiveShell(request) {
  const shellRequest = typeof request === 'string'
    ? new URL(request, self.registration.scope).href
    : request;
  return caches.open(CACHE_VERSION).then(cache => cache.match(shellRequest));
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (isNavigation) {
    event.respondWith(
      fromActiveShell('./index.html')
        .then(cached => cached
          ? withLockedViewport(cached)
          : new Response('Shell dell\'app non disponibile.', { status: 503 }))
    );
    return;
  }

  if (isSameOrigin && isShellAsset(requestUrl)) {
    event.respondWith(
      fromActiveShell(event.request)
        .then(cached => cached || new Response('Risorsa della shell non disponibile.', { status: 503 }))
    );
  }
});
