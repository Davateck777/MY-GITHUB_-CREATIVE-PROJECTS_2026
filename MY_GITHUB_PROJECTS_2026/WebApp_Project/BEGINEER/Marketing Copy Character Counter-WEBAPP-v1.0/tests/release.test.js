import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { VERSION, CACHE_NAME, VERSION_LABEL, BUILD_CHANNEL } from '../js/version.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

test('version constants are production-shaped', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(CACHE_NAME, `mccc-v${VERSION}`);
  assert.equal(BUILD_CHANNEL, 'production');
  assert.ok(VERSION_LABEL.includes(VERSION));
});

test('package.json version matches js/version.js', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, VERSION);
});

test('sw.js cache name matches js/version.js', () => {
  const sw = read('sw.js');
  const cache = sw.match(/const CACHE_NAME = '([^']+)'/)?.[1];
  const version = sw.match(/const VERSION = '([^']+)'/)?.[1];
  assert.equal(cache, CACHE_NAME, 'service worker cache name drifted from version.js');
  assert.equal(version, VERSION, 'service worker version drifted from version.js');
});

test('sw.js is classic-syntax only (no ESM imports)', () => {
  const sw = read('sw.js');
  assert.doesNotMatch(sw, /^\s*import\s/m, 'a classic service worker cannot use import statements');
  assert.doesNotMatch(sw, /^\s*export\s/m, 'service workers must not export');
});

test('every file precached by the service worker exists on disk', () => {
  const sw = read('sw.js');
  const list = sw.slice(sw.indexOf('const SHELL = ['), sw.indexOf('];', sw.indexOf('const SHELL = [')));
  const paths = [...list.matchAll(/'\.\/([^']*)'/g)].map((match) => match[1]);

  assert.ok(paths.length >= 20, `expected the full shell, found ${paths.length} entries`);
  for (const path of paths) {
    if (!path) continue; // "./" is the directory itself
    assert.ok(existsSync(join(root, path)), `service worker precaches a missing file: ${path}`);
  }
});

test('every local module imported by the pages is precached', () => {
  const sw = read('sw.js');
  const mainJs = read('js/main.js');
  const localModules = [...mainJs.matchAll(/from '\.\/([^']+)'/g)].map((m) => `js/${m[1]}`);
  for (const file of localModules) {
    assert.ok(sw.includes(`./${file}`), `${file} is imported by main.js but not precached`);
  }
});

test('every page ships production metadata', () => {
  for (const page of ['index.html', 'editor.html', 'saved.html', 'guide.html']) {
    const html = read(page);
    assert.match(html, /<html lang="en">/, `${page} is missing a language`);
    assert.match(html, /name="viewport"/, `${page} is missing a viewport`);
    assert.match(html, /http-equiv="Content-Security-Policy"/, `${page} is missing a CSP`);
    assert.match(html, /rel="manifest"/, `${page} does not link the manifest`);
    assert.match(html, /data-version/, `${page} does not stamp the version`);
    assert.doesNotMatch(html, /<script(?![^>]*src=)/, `${page} has an inline script (CSP would block it)`);
    assert.doesNotMatch(html, /style="/, `${page} has an inline style attribute (CSP would block it)`);
  }
});

test('CSP forbids inline code and limits sources to self', () => {
  const html = read('editor.html');
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test('the manifest is valid and points at real icons', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.ok(manifest.name && manifest.short_name);
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.start_url.includes('editor.html'));
  for (const icon of manifest.icons) {
    assert.ok(existsSync(join(root, icon.src)), `manifest references a missing icon: ${icon.src}`);
  }
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'), 'no maskable icon for Android');
});

test('hosting config files are present and well formed', () => {
  assert.ok(existsSync(join(root, '_headers')));
  assert.ok(existsSync(join(root, '_redirects')));
  const vercel = JSON.parse(read('vercel.json'));
  const cspHeader = vercel.headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key === 'Content-Security-Policy');
  assert.ok(cspHeader, 'vercel.json is missing a CSP header');
  assert.doesNotMatch(cspHeader.value, /unsafe-inline/);
});

test('no development language survives in shipped copy', () => {
  const files = ['index.html', 'editor.html', 'saved.html', 'guide.html', 'README.md', 'js/platforms.js'];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /\bMVP\b/, `${file} still mentions MVP`);
    assert.doesNotMatch(text, /specification only/i, `${file} still reads as a specification`);
    assert.doesNotMatch(text, /\bTBD\b|\bTODO\b|\bFIXME\b/, `${file} contains a development marker`);
    assert.doesNotMatch(text, /lorem ipsum/i, `${file} contains placeholder prose`);
  }
});

test('preview identity is configurable rather than hardcoded', () => {
  const preview = read('js/preview.js');
  assert.match(preview, /brandFrom/, 'previews should read the brand from options');
  assert.doesNotMatch(preview, /text: 'Your Brand'/, 'preview brand name is still hardcoded');
  const storage = read('js/storage.js');
  assert.match(storage, /previewBrand/);
  assert.match(storage, /normaliseBrand/);
});
