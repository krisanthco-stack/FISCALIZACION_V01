const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mainPath = path.join(__dirname, '..', 'main.js');

test('Electron main process keeps L-26 isolated from Node', () => {
  const source = fs.readFileSync(mainPath, 'utf8');
  assert.match(source, /nodeIntegration\s*:\s*false/);
  assert.match(source, /contextIsolation\s*:\s*true/);
  assert.match(source, /sandbox\s*:\s*true/);
  assert.doesNotMatch(source, /preload\s*:/);
});

test('Electron main process starts loopback server and protects navigation', () => {
  const source = fs.readFileSync(mainPath, 'utf8');
  assert.match(source, /127\.0\.0\.1/);
  assert.match(source, /will-navigate/);
  assert.match(source, /setWindowOpenHandler/);
  assert.match(source, /shell\.openExternal/);
});

test('Electron keeps a single instance so the IndexedDB origin stays stable', () => {
  const source = fs.readFileSync(mainPath, 'utf8');
  assert.match(source, /requestSingleInstanceLock/);
  assert.match(source, /second-instance/);
  assert.match(source, /\.focus\(\)/);
});
