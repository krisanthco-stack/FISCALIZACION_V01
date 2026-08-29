const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { startLocalServer, stopLocalServer } = require('../server');

async function withServer(fn) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'l26-server-'));
  await fs.writeFile(path.join(rootDir, 'index.html'), '<!doctype html><title>L26</title>', 'utf8');
  await fs.writeFile(path.join(rootDir, 'sw.js'), 'self.addEventListener("fetch",()=>{});', 'utf8');
  await fs.writeFile(path.join(rootDir, 'data.json'), '{"ok":true}', 'utf8');
  const running = await startLocalServer({ rootDir, preferredPort: 0 });
  try {
    await fn({ rootDir, ...running });
  } finally {
    await stopLocalServer(running.server);
    await fs.rm(rootDir, { recursive: true, force: true });
  }
}

test('serves index.html only on loopback with expected content type', async () => {
  await withServer(async ({ origin, server }) => {
    assert.match(origin, /^http:\/\/localhost:\d+$/);
    assert.equal(server.address().address, '127.0.0.1');
    const response = await fetch(`${origin}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^text\/html/);
    assert.match(await response.text(), /<title>L26<\/title>/);
  });
});

test('serves JSON and disables cache for service worker', async () => {
  await withServer(async ({ origin }) => {
    const json = await fetch(`${origin}/data.json`);
    assert.equal(json.status, 200);
    assert.match(json.headers.get('content-type') || '', /^application\/json/);

    const sw = await fetch(`${origin}/sw.js`);
    assert.equal(sw.status, 200);
    assert.equal(sw.headers.get('cache-control'), 'no-cache');
  });
});

test('returns 404 for missing files', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/missing.txt`);
    assert.equal(response.status, 404);
  });
});

test('rejects encoded path traversal outside root', async () => {
  await withServer(async ({ origin }) => {
    const response = await fetch(`${origin}/%2e%2e/%2e%2e/etc/passwd`);
    assert.ok([400, 403, 404].includes(response.status));
    assert.notEqual(response.status, 200);
  });
});
