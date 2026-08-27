import test from 'node:test';
import assert from 'node:assert/strict';

await import('../js/data-safety.js');
await import('../js/storage.js');

const {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  escapeHtml,
  normalizeBackupPayload,
  normalizePhoto,
  normalizeText
} = globalThis.CescoDataSafety;

const validSpot = {
  id: 'spot_1',
  name: 'Molo Nord',
  zone: 'Livorno',
  lat: 43.55,
  lng: 10.31,
  techniques: ['Spinning'],
  catches: []
};

test('accetta i vecchi backup in formato array', () => {
  const spots = normalizeBackupPayload([validSpot]);
  assert.equal(spots.length, 1);
  assert.equal(spots[0].name, 'Molo Nord');
});

test('accetta il backup CescoSpot con versione corrente', () => {
  const spots = normalizeBackupPayload({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    spots: [validSpot]
  });
  assert.equal(spots[0].id, 'spot_1');
});

test('rifiuta coordinate impossibili', () => {
  assert.throws(
    () => normalizeBackupPayload([{ ...validSpot, lat: 120 }]),
    /Coordinate non valide/
  );
});

test('rifiuta ID spot duplicati', () => {
  assert.throws(
    () => normalizeBackupPayload([validSpot, { ...validSpot }]),
    /ID spot duplicato/
  );
});

test('rifiuta backup creati da una versione futura', () => {
  assert.throws(
    () => normalizeBackupPayload({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION + 1,
      spots: [validSpot]
    }),
    /non ancora supportata/
  );
});

test('neutralizza HTML nei testi renderizzati', () => {
  assert.equal(escapeHtml(`<img src=x onerror='alert(1)'>`), '&lt;img src=x onerror=&#039;alert(1)&#039;&gt;');
});

test('neutralizza caratteri speciali nelle esportazioni GPX', () => {
  assert.equal(globalThis.escapeXml(`A&B <spot> "nord"`), 'A&amp;B &lt;spot&gt; &quot;nord&quot;');
});

test('elimina caratteri di controllo dai testi', () => {
  assert.equal(normalizeText('  Spot\u0000 sicuro  '), 'Spot sicuro');
});

test('accetta solo fotografie raster Base64 supportate', () => {
  assert.equal(normalizePhoto('data:image/svg+xml;base64,PHN2Zz4='), '');
  assert.equal(normalizePhoto('https://example.com/photo.jpg'), '');
  assert.equal(normalizePhoto('data:image/jpeg;base64,YWJjZA=='), 'data:image/jpeg;base64,YWJjZA==');
});
