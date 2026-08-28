import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il modulo lightbox espone entrambe le funzioni e app.js non le implementa', async () => {
  const [source, appSource] = await Promise.all([read('js/lightbox.js'), read('js/app.js')]);
  assert.match(source, /globalScope\.openLightbox = openLightbox/);
  assert.match(source, /globalScope\.closeLightbox = closeLightbox/);
  assert.doesNotMatch(appSource, /function\s+(?:openLightbox|closeLightbox)\s*\(/);
});

test('apertura, chiusura e pulizia differita della lightbox restano corrette', async () => {
  const source = await read('js/lightbox.js');
  const calls = [];
  const elements = {
    lightboxOverlay: {
      style: {},
      classList: { add: name => calls.push(['add', name]), remove: name => calls.push(['remove', name]) },
      offsetWidth: 0
    },
    lightboxImg: { src: '' }
  };
  const context = vm.createContext({
    document: { getElementById: id => elements[id] },
    setTimeout: (callback, delay) => { calls.push(['timeout', delay]); context.cleanup = callback; },
    console
  });
  vm.runInContext(source, context);

  context.openLightbox('foto.jpg');
  assert.equal(elements.lightboxImg.src, 'foto.jpg');
  assert.equal(elements.lightboxOverlay.style.display, 'flex');
  assert.deepEqual(calls, [['add', 'show']]);

  context.closeLightbox();
  assert.deepEqual(calls, [['add', 'show'], ['remove', 'show'], ['timeout', 300]]);
  assert.equal(elements.lightboxOverlay.style.display, 'flex');
  context.cleanup();
  assert.equal(elements.lightboxOverlay.style.display, 'none');
  assert.equal(elements.lightboxImg.src, '');
});

test('il modulo lightbox è caricato e disponibile offline', async () => {
  const [html, worker] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(html, /js\/lightbox\.js/);
  assert.match(worker, /\.\/js\/lightbox\.js/);
});
