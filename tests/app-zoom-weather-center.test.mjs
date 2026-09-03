import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

const LOCKED_VIEWPORT_CONTENT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

test('runtime online e shell PWA impongono lo stesso blocco zoom pagina', async () => {
  const html = await read('index.html');
  const manifest = await read('js/manifest.js');
  const worker = await read('sw.js');
  const viewport = {
    content: html.match(/<meta name="viewport" content="([^"]+)"/)[1],
    setAttribute(name, value) { if (name === 'content') this.content = value; }
  };
  const context = vm.createContext({
    document: {
      querySelector: selector => selector === 'meta[name="viewport"]' ? viewport : null,
      createElement: () => ({}),
      head: { appendChild() {} }
    },
    navigator: {},
    location: { protocol: 'file:' },
    window: { addEventListener() {} }
  });
  vm.runInContext(manifest, context);

  assert.equal(viewport.content, LOCKED_VIEWPORT_CONTENT);
  assert.match(html, /maximum-scale=1\.0/);
  assert.match(html, /user-scalable=no/);
  assert.match(manifest, /maximum-scale=1\.0/);
  assert.match(manifest, /user-scalable=no/);
  assert.match(worker, /LOCKED_VIEWPORT/);
  assert.match(worker, /maximum-scale=1\.0/);
  assert.match(worker, /user-scalable=no/);
  assert.match(worker, /width=device-width/);
  assert.match(worker, /initial-scale=1\.0/);
  assert.match(worker, /viewport-fit=cover/);
  assert.match(worker, /withLockedViewport/);
  assert.match(worker, /mode === 'navigate'/);
  assert.doesNotMatch(manifest, /zoom-guard\.js/);
  assert.doesNotMatch(worker, /zoom-guard\.js/);
});

test('il riepilogo meteo mobile resta centrato', async () => {
  const css = await read('styles/mobile-polish.css');

  assert.match(css, /#tabForecasts \.weather-hero-card[\s\S]*display:\s*flex/);
  assert.match(css, /#tabForecasts \.weather-hero-card[\s\S]*align-items:\s*center/);
  assert.match(css, /#tabForecasts \.weather-hero-card[\s\S]*text-align:\s*center/);
  assert.match(css, /#tabForecasts \.w-desc-text[\s\S]*text-align:\s*center/);
});
