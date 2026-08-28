import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('i moduli runtime sono caricati una volta sola e prima di app.js', async () => {
  const [html, manifest] = await Promise.all([read('index.html'), read('js/manifest.js')]);
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
  const runtimeModules = [
    'js/data-safety.js',
    'js/storage.js',
    'js/map-tap.js',
    'js/river-status.js',
    'js/quick-drop.js',
    'js/map-providers.js',
    'js/modal-accessibility.js',
    'js/weather-insights.js',
    'js/wiki-images.js',
    'js/photo-upload.js',
    'js/lightbox.js',
  ];
  const appIndex = scripts.indexOf('js/app.js');

  assert.ok(appIndex > -1);
  runtimeModules.forEach(module => {
    assert.equal(scripts.filter(script => script === module).length, 1, `${module} deve comparire una volta`);
    assert.ok(scripts.indexOf(module) < appIndex, `${module} deve precedere app.js`);
    assert.doesNotMatch(manifest, new RegExp(`createElement\\(['"]script['"]\\)[\\s\\S]*${module.replaceAll('/', '\\/')}`));
  });
});

test('il flusso spot conserva tap singolo differito e salvataggio atomico', async () => {
  const app = await read('js/app.js');

  assert.match(app, /CescoMapTap\.create\([\s\S]*onSingleTap:[\s\S]*tempMarker[\s\S]*openAddSpotModal/);
  assert.match(app, /const previousSpots = normalizeBackupPayload\(spots\)/);
  assert.match(app, /if \(!await persistSpots\(\)\) \{\s*spots = previousSpots;\s*return;/);
  assert.match(app, /renderMapSpots\(\);\s*closeModals\(\);/);
});
