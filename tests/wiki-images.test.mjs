import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

const cachedWikiImages = [
  'palomar.jpg',
  'clinch.jpg',
  'fg_knot.jpg',
  'albright.jpg',
  'rapala.jpg',
  'spallinata_aperta.jpg',
  'spallinata_chiusa.jpg',
  'corona_tocco.jpg',
  'galleggiante_scorr.jpg',
  'running_rig.jpg',
  'paternoster.jpg',
  'method_feeder.jpg',
  'jig_head.jpg',
  'drop_shot.jpg',
  'wiki/uni_paletta.svg',
  'wiki/texas_rig.svg',
];

test('i due riferimenti Wiki mancanti hanno uno schema locale sostitutivo', async () => {
  const source = await read('js/wiki-images.js');
  assert.match(source, /uni_paletta\.jpg.*wiki\/uni_paletta\.svg/s);
  assert.match(source, /texas_rig\.jpg.*wiki\/texas_rig\.svg/s);
  assert.match(source, /loading.*lazy/s);
  assert.match(source, /decoding.*async/s);

  await Promise.all([
    access(new URL('wiki/uni_paletta.svg', root)),
    access(new URL('wiki/texas_rig.svg', root)),
  ]);
});

test('le immagini Wiki sono disponibili nella cache PWA', async () => {
  const worker = await read('sw.js');
  const manifest = await read('js/manifest.js');

  assert.match(worker, /const CACHE_VERSION = 'cescospot-v\d+';/);
  assert.match(manifest, /js\/wiki-images\.js/);
  assert.match(worker, /js\/wiki-images\.js/);

  for (const path of cachedWikiImages) {
    assert.match(worker, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await access(new URL(path, root));
  }
});
