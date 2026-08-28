const CACHE_VERSION = 'cescospot-v16';
const APP_SHELL = [
  './',
  './index.html',
  './styles/app.css',
  './styles/mobile-polish.css',
  './styles/weather-insights.css',
  './js/manifest.js',
  './js/data-safety.js',
  './js/storage.js',
  './js/app.js',
  './js/quick-drop.js',
  './js/river-status.js',
  './js/map-providers.js',
  './js/modal-accessibility.js',
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
  './map.png',
  './palomar.jpg',
  './clinch.jpg',
  './fg_knot.jpg',
  './albright.jpg',
  './rapala.jpg',
  './spallinata_aperta.jpg',
  './spallinata_chiusa.jpg',
  './corona_tocco.jpg',
  './galleggiante_scorr.jpg',
  './running_rig.jpg',
  './paternoster.jpg',
  './method_feeder.jpg',
  './jig_head.jpg',
  './drop_shot.jpg',
  './wiki/uni_paletta.svg',
  './wiki/texas_rig.svg'
];

const LOCKED_VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">';

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
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then(response => withLockedViewport(response))
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then(cached => withLockedViewport(cached)))
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
        return response;
      }))
    );
    return;
  }
});
