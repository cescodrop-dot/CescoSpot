import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('carica gli asset locali estratti dal file principale', async () => {
  const html = await read('index.html');

  assert.match(html, /href="styles\/app\.css"/);
  assert.match(html, /href="vendor\/fontawesome\/css\/all\.min\.css"/);
  assert.doesNotMatch(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
  assert.match(html, /src="js\/manifest\.js"/);
  assert.match(html, /src="js\/data-safety\.js"/);
  assert.match(html, /src="js\/storage\.js"/);
  assert.match(html, /src="js\/app\.js"/);

  await Promise.all([
    read('styles/app.css'),
    read('js/manifest.js'),
    read('js/data-safety.js'),
    read('js/storage.js'),
    read('js/app.js'),
    read('vendor/fontawesome/css/all.min.css'),
    read('vendor/fontawesome/webfonts/fa-solid-900.woff2'),
    read('vendor/fontawesome/webfonts/fa-regular-400.woff2'),
  ]);
});

test('non conserva grandi blocchi CSS o JavaScript inline', async () => {
  const html = await read('index.html');

  assert.doesNotMatch(html, /<style(?:\s|>)/i);
  assert.doesNotMatch(html, /<script>(?:.|\n){200,}<\/script>/i);
});
