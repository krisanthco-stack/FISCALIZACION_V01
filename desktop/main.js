'use strict';

const path = require('node:path');
const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require('electron');
const { startLocalServer, stopLocalServer } = require('./server');

const APP_HOST = '127.0.0.1';
const PREFERRED_PORT = 18126;
const READER_TOOLBAR_HEIGHT = 72;
let localServer = null;
let localOrigin = null;
let mainWindow = null;
const readerContexts = new Map();

function runtimeRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.resolve(__dirname, '..');
}

function isExternalSafeUrl(target) {
  try {
    const parsed = new URL(target);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isReaderHttpUrl(target) {
  try {
    return ['http:', 'https:'].includes(new URL(target).protocol);
  } catch {
    return false;
  }
}

function isLocalUrl(target) {
  try {
    return Boolean(localOrigin) && new URL(target).origin === localOrigin;
  } catch {
    return false;
  }
}

async function openExternal(target) {
  if (isExternalSafeUrl(target) && !isLocalUrl(target)) {
    await shell.openExternal(target);
  }
}

function safeReaderPayload(payload) {
  const url = String(payload?.url || '').trim();
  if (!isReaderHttpUrl(url)) throw new Error('Solo se permiten enlaces HTTP/HTTPS en el lector interno.');
  return {
    url,
    caseId: String(payload?.caseId || '').trim(),
    tramite: String(payload?.tramite || '').trim(),
  };
}

function sendReaderState(context, patch = {}) {
  const { window: readerWindow, view, tramite } = context;
  if (readerWindow.isDestroyed() || view.webContents.isDestroyed()) return;
  const history = view.webContents.navigationHistory;
  readerWindow.webContents.send('l26:reader-state', {
    url: view.webContents.getURL(),
    caseLabel: tramite ? `Fuente del expediente ${tramite}` : 'Fuente del expediente',
    loading: view.webContents.isLoading(),
    canGoBack: history.canGoBack(),
    canGoForward: history.canGoForward(),
    ...patch,
  });
}

function sizeReaderView(context) {
  const { window: readerWindow, view } = context;
  if (readerWindow.isDestroyed()) return;
  const [width, height] = readerWindow.getContentSize();
  view.setBounds({
    x: 0,
    y: READER_TOOLBAR_HEIGHT,
    width: Math.max(0, width),
    height: Math.max(0, height - READER_TOOLBAR_HEIGHT),
  });
}

function remoteAreaSelector() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    const box = document.createElement('div');
    const hint = document.createElement('div');
    Object.assign(overlay.style, { position:'fixed', inset:'0', zIndex:'2147483647', cursor:'crosshair', background:'rgba(18,92,65,.035)', touchAction:'none' });
    Object.assign(box.style, { position:'fixed', display:'none', border:'2px solid #157347', background:'rgba(21,115,71,.12)', pointerEvents:'none' });
    Object.assign(hint.style, { position:'fixed', left:'50%', top:'12px', transform:'translateX(-50%)', padding:'8px 12px', borderRadius:'8px', background:'rgba(20,45,35,.92)', color:'#fff', font:'600 13px system-ui', pointerEvents:'none' });
    hint.textContent = 'Arrastre sobre el área que desea leer · Esc para cancelar';
    overlay.append(box, hint);
    document.documentElement.appendChild(overlay);
    let startPoint = null;
    const rectFrom = (a,b) => ({ x:Math.min(a.x,b.x), y:Math.min(a.y,b.y), width:Math.abs(b.x-a.x), height:Math.abs(b.y-a.y) });
    const intersects = (a,b) => a.left < b.x+b.width && a.right > b.x && a.top < b.y+b.height && a.bottom > b.y;
    const textInside = rect => {
      const parts = [], walker = document.createTreeWalker(document.body, 4);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement || overlay.contains(node.parentElement)) continue;
        const text = String(node.textContent || '').replace(/\s+/g,' ').trim();
        if (!text) continue;
        const style = getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const hit = [...range.getClientRects()].some(r => intersects(r, rect));
        range.detach?.();
        if (hit) parts.push(text);
      }
      return parts.join(' ').replace(/\s+/g,' ').trim();
    };
    const cleanup = () => { window.removeEventListener('keydown', onKey, true); overlay.remove(); };
    const finish = value => { cleanup(); resolve(value); };
    const onKey = event => { if (event.key === 'Escape') finish({ cancelled:true }); };
    window.addEventListener('keydown', onKey, true);
    overlay.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      startPoint = { x:event.clientX, y:event.clientY };
      overlay.setPointerCapture?.(event.pointerId);
      box.style.display='block';
      Object.assign(box.style,{left:`${startPoint.x}px`,top:`${startPoint.y}px`,width:'0px',height:'0px'});
    });
    overlay.addEventListener('pointermove', event => {
      if (!startPoint) return;
      event.preventDefault();
      const rect=rectFrom(startPoint,{x:event.clientX,y:event.clientY});
      Object.assign(box.style,{left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.width}px`,height:`${rect.height}px`});
    });
    overlay.addEventListener('pointerup', event => {
      if (!startPoint) return;
      event.preventDefault();
      const rect=rectFrom(startPoint,{x:event.clientX,y:event.clientY});
      startPoint=null;
      if (rect.width < 6 || rect.height < 6) return finish({ cancelled:true, reason:'small' });
      finish({ cancelled:false, rect, text:textInside(rect), title:document.title||'', url:location.href });
    });
  });
}

async function readRemotePage(context) {
  const { view, caseId, tramite } = context;
  const code = `(() => ({ text:(document.body?.innerText || document.documentElement?.innerText || '').replace(/\\s+/g, ' ').trim(), title:document.title || '', url:location.href }))()`;
  const result = await view.webContents.executeJavaScriptInIsolatedWorld(101, [{ code }], true);
  const text = String(result?.text || '').trim();
  if (!text) {
    sendReaderState(context, { status: 'La página no contiene texto legible.' });
    return { sent:false, reason:'empty' };
  }
  if (!mainWindow || mainWindow.isDestroyed()) return { sent:false, reason:'main-window-missing' };
  mainWindow.webContents.send('l26:reader-data', { caseId, tramite, text, url:String(result?.url || view.webContents.getURL()), title:String(result?.title || view.webContents.getTitle()), mode:'page' });
  sendReaderState(context, { status:'Página enviada a L-26.' });
  return { sent:true };
}

function remoteOcrImage(dataUrl) {
  return (async () => {
    if (typeof TextDetector !== 'function') return { available:false, text:'' };
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const detector = new TextDetector();
    const blocks = await detector.detect(image);
    return { available:true, text:(blocks || []).map(block => String(block.rawValue || '')).filter(Boolean).join('\n') };
  })();
}

async function readRemoteArea(context) {
  const { view, caseId, tramite } = context;
  sendReaderState(context, { status:'Arrastre un rectángulo sobre el área que desea leer.' });
  const code = `(${remoteAreaSelector.toString()})()`;
  const result = await view.webContents.executeJavaScriptInIsolatedWorld(101, [{ code }], true);
  if (result?.cancelled) {
    sendReaderState(context, { status:'Lectura de área cancelada.' });
    return { sent:false, reason:'cancelled' };
  }
  let text = String(result?.text || '').trim();
  let ocrUsed = false;
  if (!text && result?.rect) {
    const bounds = view.getBounds();
    const x=Math.max(0,Math.floor(Number(result.rect.x)||0)), y=Math.max(0,Math.floor(Number(result.rect.y)||0));
    const width=Math.max(1,Math.min(Math.ceil(Number(result.rect.width)||1),Math.max(1,bounds.width-x)));
    const height=Math.max(1,Math.min(Math.ceil(Number(result.rect.height)||1),Math.max(1,bounds.height-y)));
    const image = await view.webContents.capturePage({ x, y, width, height });
    const dataUrl = image.toDataURL();
    const ocrCode = `(${remoteOcrImage.toString()})(${JSON.stringify(dataUrl)})`;
    const ocr = await view.webContents.executeJavaScriptInIsolatedWorld(101, [{ code:ocrCode }], true);
    text = String(ocr?.text || '').trim();
    ocrUsed = Boolean(text);
    if (!text && ocr?.available === false) {
      sendReaderState(context, { status:'El área no contiene texto seleccionable y OCR no está disponible en este dispositivo.' });
      return { sent:false, reason:'ocr-unavailable' };
    }
  }
  if (!text) {
    sendReaderState(context, { status:'No se encontró texto en el área seleccionada.' });
    return { sent:false, reason:'empty' };
  }
  if (!mainWindow || mainWindow.isDestroyed()) return { sent:false, reason:'main-window-missing' };
  mainWindow.webContents.send('l26:reader-data', { caseId, tramite, text, url:String(result?.url || view.webContents.getURL()), title:String(result?.title || view.webContents.getTitle()), mode:'area', ocr:ocrUsed });
  sendReaderState(context, { status:ocrUsed?'Área reconocida por OCR y enviada a L-26.':'Área enviada a L-26.' });
  return { sent:true, ocr:ocrUsed };
}

function createReaderWindow(rawPayload) {
  const payload = safeReaderPayload(rawPayload);
  const readerWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 620,
    parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
    modal: false,
    autoHideMenuBar: true,
    show: false,
    title: payload.tramite ? `L-26 · ${payload.tramite} · Fuente` : 'L-26 · Fuente del expediente',
    webPreferences: {
      preload: path.join(__dirname, 'reader-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      partition: 'persist:l26-source-reader',
    },
  });
  readerWindow.contentView.addChildView(view);
  const context = { window: readerWindow, view, caseId: payload.caseId, tramite: payload.tramite };
  readerContexts.set(readerWindow.webContents.id, context);
  sizeReaderView(context);
  readerWindow.on('resize', () => sizeReaderView(context));

  const update = () => sendReaderState(context);
  view.webContents.on('did-start-loading', update);
  view.webContents.on('did-stop-loading', update);
  view.webContents.on('did-navigate', update);
  view.webContents.on('did-navigate-in-page', update);
  view.webContents.on('page-title-updated', update);
  view.webContents.on('did-fail-load', (_event, code, description) => {
    sendReaderState(context, { status: `No se pudo cargar la página (${code}): ${description}` });
  });
  view.webContents.on('will-navigate', (event, target) => {
    if (isReaderHttpUrl(target)) return;
    event.preventDefault();
    if (isExternalSafeUrl(target)) void openExternal(target);
  });
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (isReaderHttpUrl(url)) void view.webContents.loadURL(url);
    else if (isExternalSafeUrl(url)) void openExternal(url);
    return { action: 'deny' };
  });

  readerWindow.once('ready-to-show', () => readerWindow.show());
  readerWindow.on('closed', () => {
    readerContexts.delete(readerWindow.webContents.id);
    try { readerWindow.contentView.removeChildView(view); } catch (_) {}
    if (!view.webContents.isDestroyed()) view.webContents.close({ waitForBeforeUnload: false });
  });
  void readerWindow.loadFile(path.join(__dirname, 'reader.html'));
  void view.webContents.loadURL(payload.url);
  return readerWindow;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    show: false,
    title: 'Fiscalización Bienes Inmuebles L-26',
    webPreferences: {
      preload: path.join(__dirname, 'app-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.webContents.on('will-navigate', (event, target) => {
    if (isLocalUrl(target)) return;
    event.preventDefault();
    void openExternal(target);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void openExternal(url);
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => win.show());
  void win.loadURL(`${localOrigin}/`);
  mainWindow = win;
  return win;
}

ipcMain.handle('l26:open-source', (event, payload) => {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender.id !== mainWindow.webContents.id) {
    throw new Error('Solicitud de lector no autorizada.');
  }
  createReaderWindow(payload);
  return { opened: true };
});

ipcMain.on('l26:reader-command', (event, payload) => {
  const context = readerContexts.get(event.sender.id);
  if (!context) return;
  const command = String(payload?.command || '');
  const { window: readerWindow, view } = context;
  const history = view.webContents.navigationHistory;
  if (command === 'back' && history.canGoBack()) history.goBack();
  else if (command === 'forward' && history.canGoForward()) history.goForward();
  else if (command === 'reload') view.webContents.reload();
  else if (command === 'read-page') void readRemotePage(context).catch(error => sendReaderState(context, { status: `No se pudo leer: ${error.message}` }));
  else if (command === 'read-area') void readRemoteArea(context).catch(error => sendReaderState(context, { status: `No se pudo leer el área: ${error.message}` }));
  else if (command === 'close' && !readerWindow.isDestroyed()) readerWindow.close();
});

async function startApp() {
  const running = await startLocalServer({ rootDir: runtimeRoot(), preferredPort: PREFERRED_PORT });
  localServer = running.server;
  localOrigin = running.origin;
  const address = localServer.address();
  if (!address || typeof address === 'string' || address.address !== APP_HOST) {
    throw new Error('El servidor local no está ligado a 127.0.0.1');
  }
  createWindow();
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  app.whenReady().then(startApp).catch(error => {
    console.error(error);
    app.quit();
  });
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && localOrigin) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', event => {
  if (!localServer) return;
  event.preventDefault();
  const server = localServer;
  localServer = null;
  stopLocalServer(server)
    .catch(error => console.error('No se pudo cerrar el servidor local:', error))
    .finally(() => app.quit());
});
