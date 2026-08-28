import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('layout mobile polish viene caricato e resta disponibile offline', async () => {
  const [manifest, worker, css] = await Promise.all([
    read('js/manifest.js'),
    read('sw.js'),
    read('styles/mobile-polish.css'),
  ]);

  assert.match(manifest, /styles\/mobile-polish\.css/);
  assert.match(worker, /styles\/mobile-polish\.css/);
  assert.match(worker, /cescospot-v\d+/);

  assert.match(css, /\.nav-item\.active/);
  assert.match(css, /#tabForecasts \.metric-grid/);
  assert.match(css, /grid-template-columns:\s*repeat\(2/);
  assert.match(css, /\.map-btn/);
  assert.match(css, /scroll-snap-type:\s*x proximity/);
});
