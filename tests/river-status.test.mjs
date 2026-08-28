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


test('il flusso idrologico passa esplicitamente dal modulo senza override fetch', async () => {
  const [{ readFile }, appSource, moduleSource] = await Promise.all([
    import('node:fs/promises'),
    readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../js/river-status.js', import.meta.url), 'utf8')
  ]);
  assert.match(appSource, /flood-api\.open-meteo\.com\/v1\/flood/);
  assert.match(appSource, /CescoRiverStatus\.renderRiverStatus\(fdata\?\.daily\?\.river_discharge\)/);
  assert.doesNotMatch(appSource, /Regolare \/ Pescabile|Portata Alta \/ Piena/);
  assert.doesNotMatch(moduleSource, /globalScope\.fetch\s*=|installFloodResponseObserver|setTimeout\(/);
  assert.match(moduleSource, /globalScope\.CescoRiverStatus\s*=.*renderRiverStatus/s);
});
