const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'desktop', 'package.json'), 'utf8'));
const main = fs.readFileSync(path.join(ROOT, 'desktop', 'main.js'), 'utf8');
const readme = fs.readFileSync(path.join(ROOT, 'desktop', 'README_WINDOWS.md'), 'utf8');

test('Windows autónomo se empaqueta con Electron + NSIS y runtime local', () => {
  assert.equal(pkg.main, 'main.js');
  assert.equal(pkg.devDependencies.electron, '44.0.0');
  assert.equal(pkg.devDependencies['electron-builder'], '26.15.7');
  const targets = Array.isArray(pkg.build?.win?.target) ? pkg.build.win.target : [];
  assert.ok(targets.includes('nsis'), 'falta target NSIS');
  assert.ok(targets.includes('portable'), 'falta target portable');
  assert.ok(Array.isArray(pkg.build?.extraResources) && pkg.build.extraResources.length > 0, 'falta runtime web local');
  assert.match(main, /new BrowserWindow\s*\(/);
  assert.match(main, /127\.0\.0\.1/);
  assert.doesNotMatch(main, /(?:chrome|msedge|edge\.exe)\s*(?:--app|\.exe)/i);
});

test('documentación de usuario final no exige navegador ni npm para ejecutar el instalador', () => {
  assert.match(readme, /Fiscalizacion-L26-Setup-/);
  assert.match(readme, /no necesita instalar Node\.js, Python, GitHub, Chrome ni Edge/i);
  assert.match(readme, /Chromium.*incluido|incluye.*Chromium/i);
  assert.doesNotMatch(readme, /haga doble clic en:\s*`ABRIR_L26_WINDOWS\.cmd`/i);
  assert.doesNotMatch(readme, /lanzador ejecuta `npm install`/i);
});
