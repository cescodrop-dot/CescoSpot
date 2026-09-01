import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('il viewport bloccato viene applicato anche al fallback offline', async () => {
  const worker = await readFile(new URL('sw.js', root), 'utf8');
  assert.match(worker, /fromActiveShell\('\.\/index\.html'\)[\s\S]*withLockedViewport\(cached\)/);
});
