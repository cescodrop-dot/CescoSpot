import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../styles/app.css', import.meta.url), 'utf8');
const mobile = await readFile(new URL('../styles/mobile-polish.css', import.meta.url), 'utf8');
const controls = ':is(button, .wiki-chip, .tech-chip):not(:where(.leaflet-container *, .lightbox-overlay *))';
const press = controls + ':not(:disabled):not([aria-disabled="true"]):active';
const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
function rule(source, selector) {
  const start = source.indexOf(selector + ' {');
  assert.notEqual(start, -1, `Missing rule: ${selector}`);
  return source.slice(start + selector.length, source.indexOf('}', start) + 1);
}

test('feedback condiviso: transizioni esplicite di 160ms senza geometria/layout', () => {
  const shared = rule(css, controls);
  for (const property of ['transform', 'filter', 'background-color', 'border-color', 'opacity']) {
    assert.ok(shared.includes(`${property} 160ms ease`));
  }
  assert.doesNotMatch(shared, /\b(all|width|height|padding|margin|left|top)\b/);
  assert.equal(css.split(controls + ' {').length - 1, 1);
  assert.doesNotMatch(rule(mobile, '.nav-item'), /transition:/);
});

test('pressione lieve senza ritardi e senza applicarla ai pulsanti disabilitati', () => {
  const active = rule(css, press);
  assert.match(active, /transform: scale\(0\.97\)/);
  assert.match(active, /filter: brightness\(0\.96\)/);
  assert.doesNotMatch(active, /transition-delay|pointer-events/);
  assert.match(rule(css, 'button:not(:where(.leaflet-container *, .lightbox-overlay *)):disabled'), /opacity: 0\.72/);
});

test('reduced motion annulla lo scale con la stessa specificità e riduce le transizioni', () => {
  assert.match(rule(reduced, press), /transform: none/);
  assert.match(reduced, /transition-duration: 0\.01ms !important/);
});

test('controlli mappa e Rig Lab hanno hover solo con mouse e nessun salto verticale', () => {
  const mouseBlocks = [...css.matchAll(/@media \(hover: hover\) and \(pointer: fine\) \{([^]*?)\n    \}/g)].map(m => m[1]);
  assert.ok(mouseBlocks.some(block => block.includes('.map-btn:hover')));
  assert.ok(mouseBlocks.some(block => block.includes('#tabRigLab .btn-generate:hover')));
  assert.doesNotMatch(rule(css, '#tabRigLab .btn-generate:hover'), /transform:/);
});
