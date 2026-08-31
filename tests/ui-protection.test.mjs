import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('la UI non seleziona testo ma mantiene selezionabili i campi', async () => {
  const css = await read('styles/app.css');
  assert.match(css, /body,\s*body \*\s*\{[\s\S]*user-select:\s*none/);
  assert.match(css, /input,\s*textarea,\s*\[contenteditable="true"\][\s\S]*user-select:\s*text/);
});

test('le immagini restano cliccabili e protette dal trascinamento', async () => {
  const [css, app, html] = await Promise.all([read('styles/app.css'), read('js/app.js'), read('index.html')]);
  assert.match(css, /img\s*\{[\s\S]*-webkit-user-drag:\s*none/);
  assert.match(app, /addEventListener\('dragstart'/);
  assert.match(app, /addEventListener\('contextmenu'/);
  assert.match(html, /onclick="openLightbox\(this\.src\)"/);
});
