import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('il caricamento foto limita sorgente e output e gestisce gli errori', async () => {
  const source = await read('js/photo-upload.js');

  assert.match(source, /MAX_SOURCE_BYTES = 20 \* 1024 \* 1024/);
  assert.match(source, /MAX_OUTPUT_CHARS = 1_000_000/);
  assert.match(source, /String\(file\.type \|\| ''\)\.startsWith\('image\/'\)/);
  assert.match(source, /reader\.onerror/);
  assert.match(source, /img\.onerror/);
  assert.match(source, /toDataURL\('image\/jpeg'/);
  assert.match(source, /dataUrl\.length <= MAX_OUTPUT_CHARS/);
});

test('il modulo foto possiede direttamente handlePhotoUpload', async () => {
  const [source, appSource] = await Promise.all([
    read('js/photo-upload.js'),
    read('js/app.js')
  ]);

  assert.match(source, /globalScope\.handlePhotoUpload = robustPhotoUpload/);
  assert.doesNotMatch(appSource, /function\s+handlePhotoUpload\s*\(/);
  assert.doesNotMatch(source, /typeof globalScope\.handlePhotoUpload !== 'function'/);
  assert.doesNotMatch(source, /DOMContentLoaded|setInterval/);
});

test('il gestore foto è caricato e disponibile offline', async () => {
  const manifest = await read('js/manifest.js');
  const worker = await read('sw.js');

  assert.match(manifest, /js\/photo-upload\.js/);
  assert.match(worker, /\.\/js\/photo-upload\.js/);
  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+';/);
});
