const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', '..');
const main = fs.readFileSync(path.join(root, 'desktop', 'main.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'desktop', 'package.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const LOGIN = 'https://metro.sarapiqui.go.cr/login';

test('Windows installer registers l26-reader protocol for Electron', () => {
  const protocols = pkg.build?.protocols || [];
  assert.ok(protocols.some(p => Array.isArray(p.schemes) && p.schemes.includes('l26-reader')));
  assert.match(main, /setAsDefaultProtocolClient\(['"]l26-reader['"]\)/);
  assert.match(main, /second-instance/);
  assert.match(main, /process\.argv/);
});

test('Windows Web/PWA opens Metro URL directly and does not require installed Electron protocol', async () => {
  const start = html.indexOf('function isL26DesktopShell()');
  const end = html.indexOf('function caseFieldValue', start);
  assert.ok(start >= 0 && end > start);
  const source = html.slice(start, end);
  const location = { search: '', href: 'https://l26.example/index.html' };
  const calls = { open: [], toast: [] };
  const context = {
    URLSearchParams,
    location,
    window: { location, L26Android: undefined, l26Desktop: undefined, open:(...a)=>calls.open.push(a) },
    navigator: { userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/140.0', platform:'Win32' },
    console,
    toast:m=>calls.toast.push(String(m)),
  };
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.openCaseSource=openCaseSource;`, context);
  await context.openCaseSource({ sourceLink: LOGIN, id:'case-1', general:{tramite:'T-1'} });
  assert.equal(calls.open.length, 1);
  assert.equal(calls.open[0][0], LOGIN);
  assert.equal(calls.open[0][1], '_blank');
  assert.equal(location.href, 'https://l26.example/index.html');
});

test('main process decodes exact Metro login URL from deep link', () => {
  const pick = (name,next) => {
    const a=main.indexOf(`function ${name}`), b=main.indexOf(`function ${next}`,a);
    assert.ok(a>=0 && b>a); return main.slice(a,b);
  };
  const sandbox={URL}; vm.createContext(sandbox);
  vm.runInContext(`${pick('isReaderHttpUrl','isLocalUrl')}\n${pick('safeReaderPayload','sendReaderState')}\n${pick('desktopReaderRequest','deliverToMainWindow')}\nthis.parse=desktopReaderRequest;`,sandbox);
  const link=`l26-reader://open?url=${encodeURIComponent(LOGIN)}&caseId=case-1&tramite=T-1`;
  const payload=sandbox.parse(link);
  assert.equal(payload.url, LOGIN);
});
