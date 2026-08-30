const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const desktop = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(desktop, name), 'utf8');

test('desktop provides an isolated internal web reader instead of forcing every https link external', () => {
  const main = read('main.js');
  assert.match(main, /WebContentsView/);
  assert.match(main, /createReaderWindow/);
  assert.match(main, /persist:l26-source-reader/);
  assert.match(main, /nodeIntegration\s*:\s*false/);
  assert.match(main, /contextIsolation\s*:\s*true/);
  assert.match(main, /sandbox\s*:\s*true/);
  assert.match(main, /l26:open-source/);
  assert.match(main, /l26:reader-command/);
  assert.match(main, /l26:reader-data/);
});

test('main app preload exposes narrow open/read APIs through contextBridge', () => {
  const preload = read('app-preload.js');
  assert.match(preload, /contextBridge\.exposeInMainWorld\(['"]l26Desktop['"]/);
  assert.match(preload, /openSource/);
  assert.match(preload, /ipcRenderer\.invoke\(['"]l26:open-source['"]/);
  assert.match(preload, /onReaderData/);
  assert.match(preload, /callback\(payload\)/);
  assert.doesNotMatch(preload, /require\(['"](?:fs|child_process|path)['"]\)/);
});

test('reader toolbar supports navigation, page read, area read and close', () => {
  const html = read('reader.html');
  const preload = read('reader-preload.js');
  for (const id of ['readerBack','readerForward','readerReload','readerReadPage','readerReadArea','readerClose']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(preload, /l26:reader-command/);
  assert.match(preload, /read-page/);
  assert.match(preload, /read-selection/);
});

test('desktop package includes the preload and reader runtime files', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const file of ['app-preload.js','reader-preload.js','reader.html']) {
    assert.ok(pkg.build.files.includes(file), `${file} missing from build.files`);
  }
});
