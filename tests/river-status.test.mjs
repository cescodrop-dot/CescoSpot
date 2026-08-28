import assert from 'node:assert/strict';
import test from 'node:test';

await import('../js/river-status.js');

const { classifyRiverStatus } = globalThis.CescoRiverStatus;

test('usa il valore di oggi e ignora i giorni futuri', () => {
  const result = classifyRiverStatus([100, 100, 110, 500, 800], 2);
  assert.equal(result.current, 110);
  assert.equal(result.status, 'Portata relativamente stabile');
});

test('segnala un aumento relativo senza dichiarare piena o pescabilità', () => {
  const result = classifyRiverStatus([100, 110, 160, 170, 180], 2);
  assert.equal(result.status, 'Portata in forte aumento');
  assert.equal(result.trend, 'Forte aumento');
});

test('gestisce un calo relativo', () => {
  const result = classifyRiverStatus([100, 100, 60, 50, 40], 2);
  assert.equal(result.status, 'Portata in forte diminuzione');
});

test('non inventa uno stato con dati insufficienti', () => {
  const result = classifyRiverStatus([null, null, 12, null, null], 2);
  assert.equal(result.available, false);
  assert.equal(result.status, 'Dati idrologici insufficienti');
});
