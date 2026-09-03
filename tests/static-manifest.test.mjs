import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function manifestHref(html) {
  const match = html.match(/<link\s+[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  assert.ok(match, 'Il markup deve includere un link manifest statico con href');
  return match[1];
}

test('il manifest PWA è statico, valido e non dipende da un Blob runtime', async () => {
  const [html, manifestSource, worker, manifestText] = await Promise.all([
    read('index.html'),
    read('js/manifest.js'),
    read('sw.js'),
    read('manifest.webmanifest')
  ]);
  const href = manifestHref(html);
  const manifest = JSON.parse(manifestText);

  assert.equal(href, './manifest.webmanifest');
  assert.equal(manifest.name, 'CescoSpot Pro');
  assert.equal(manifest.short_name, 'CescoSpot PRO');
  assert.equal(manifest.start_url, '.');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#070d1d');
  assert.equal(manifest.theme_color, '#070d1d');
  assert.deepEqual(manifest.icons, [{ src: 'assets/images/app/map.png', sizes: '512x512', type: 'image/png' }]);
  assert.doesNotMatch(manifestSource, /\bBlob\s*\(/);
  assert.doesNotMatch(manifestSource, /URL\.createObjectURL/);
  assert.doesNotMatch(manifestSource, /manifestLink/);
  assert.match(worker, /['"]\.\/manifest\.webmanifest['"]/);
});

for (const [pageUrl, manifestUrl] of [
  ['https://app.test/', 'https://app.test/manifest.webmanifest'],
  ['https://app.test/CescoSpot/', 'https://app.test/CescoSpot/manifest.webmanifest']
]) {
  test(`il manifest statico risolve correttamente sotto ${pageUrl}`, async () => {
    const html = await read('index.html');
    const manifest = JSON.parse(await read('manifest.webmanifest'));
    const resolvedManifestUrl = new URL(manifestHref(html), pageUrl);

    assert.equal(resolvedManifestUrl.href, manifestUrl);
    assert.equal(new URL(manifest.start_url, resolvedManifestUrl).href, pageUrl);
    assert.equal(
      new URL(manifest.icons[0].src, resolvedManifestUrl).href,
      new URL('assets/images/app/map.png', pageUrl).href
    );
  });
}
