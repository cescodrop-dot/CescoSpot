import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('carica gli asset locali estratti dal file principale', async () => {
  const html = await read('index.html');
  const manifest = await read('js/manifest.js');

  assert.match(html, /href="styles\/app\.css"/);
  assert.match(html, /href="vendor\/fontawesome\/css\/all\.min\.css"/);
  assert.doesNotMatch(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
  assert.match(html, /src="js\/manifest\.js"/);
  assert.match(html, /src="js\/data-safety\.js"/);
  assert.match(html, /src="js\/storage\.js"/);
  assert.match(html, /src="js\/app\.js"/);
  assert.match(manifest, /js\/quick-drop\.js/);
  assert.match(manifest, /js\/river-status\.js/);

  await Promise.all([
    read('styles/app.css'),
    read('js/manifest.js'),
    read('js/data-safety.js'),
    read('js/storage.js'),
    read('js/app.js'),
    read('js/quick-drop.js'),
    read('js/river-status.js'),
    read('vendor/fontawesome/css/all.min.css'),
    read('vendor/fontawesome/webfonts/fa-solid-900.woff2'),
    read('vendor/fontawesome/webfonts/fa-regular-400.woff2'),
  ]);
});

test('spot rapido usa le coordinate GPS ricevute', async () => {
  const quickDrop = await read('js/quick-drop.js');

  assert.match(quickDrop, /latitude: lat, longitude: lng/);
  assert.match(quickDrop, /lat\.toFixed\(4\).*lng\.toFixed\(4\)/s);
  assert.doesNotMatch(quickDrop, /center\.lat|center\.lng/);
});

test('stato fiumi non promette pescabilità né usa soglie assolute universali', async () => {
  const riverStatus = await read('js/river-status.js');

  assert.doesNotMatch(riverStatus, /pescabile|piena/i);
  assert.doesNotMatch(riverStatus, /todayVal\s*>\s*150|diff\s*>\s*40/);
  assert.match(riverStatus, /relativeChange/);
});

test('non conserva grandi blocchi CSS o JavaScript inline', async () => {
  const html = await read('index.html');

  assert.doesNotMatch(html, /<style(?:\s|>)/i);
  assert.doesNotMatch(html, /<script>(?:.|\n){200,}<\/script>/i);
});
