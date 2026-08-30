import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('modali ricevono semantica dialog e nome accessibile', async () => {
  const source = await read('js/modal-accessibility.js');

  assert.match(source, /setAttribute\('role', 'dialog'\)/);
  assert.match(source, /setAttribute\('aria-modal', 'true'\)/);
  assert.match(source, /aria-labelledby/);
  assert.match(source, /aria-label', 'Finestra di dialogo'/);
});

test('focus viene gestito in apertura, tab ed uscita', async () => {
  const source = await read('js/modal-accessibility.js');

  assert.match(source, /document\.activeElement/);
  assert.match(source, /trapFocus/);
  assert.match(source, /event\.key === 'Tab'/);
  assert.match(source, /opener\.focus/);
});

test('Escape usa il controllo di chiusura esistente', async () => {
  const source = await read('js/modal-accessibility.js');

  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /requestClose\(modal\)/);
  assert.match(source, /closeControl\.click\(\)/);
  assert.doesNotMatch(source, /modal\.style\.display\s*=\s*['"]none/);
});

test('modulo modali è escluso dalla pagina nella prova diagnostica', async () => {
  const html = await read('index.html');
  const worker = await read('sw.js');

  assert.doesNotMatch(html, /js\/modal-accessibility\.js/);
  assert.doesNotMatch(worker, /js\/modal-accessibility\.js/);
  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+';/);
});
