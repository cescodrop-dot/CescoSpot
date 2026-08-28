import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('provider mappa e gestore foto non usano polling di inizializzazione', async () => {
  const [providers, photos] = await Promise.all([
    read('js/map-providers.js'),
    read('js/photo-upload.js')
  ]);

  assert.doesNotMatch(providers, /setInterval\s*\(/);
  assert.match(providers, /DOMContentLoaded/);
  assert.match(providers, /\{ once: true \}/);

  assert.doesNotMatch(photos, /setInterval\s*\(/);
  assert.match(photos, /globalScope\.handlePhotoUpload\s*=\s*robustPhotoUpload/);
  assert.doesNotMatch(photos, /typeof globalScope\.handlePhotoUpload/);
});
