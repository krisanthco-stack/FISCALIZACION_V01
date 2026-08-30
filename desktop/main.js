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

async function readRemotePage(context, mode) {
  const { view, caseId, tramite } = context;
  const selectionOnly = mode === 'selection';
  const code = `(() => {
    const selected = (globalThis.getSelection?.().toString() || '').trim();
    const bodyText = (document.body?.innerText || document.documentElement?.innerText || '').replace(/\\s+/g, ' ').trim();
    return { text: ${selectionOnly ? 'selected' : 'bodyText'}, title: document.title || '', url: location.href };
  })()`;
  const result = await view.webContents.executeJavaScriptInIsolatedWorld(101, [{ code }], true);
  const text = String(result?.text || '').trim();
  if (!text) {
    const message = selectionOnly ? 'Seleccione el texto del área dentro de la página y vuelva a pulsar Leer área.' : 'La página no contiene texto legible.';
    sendReaderState(context, { status: message });
    return { sent: false, reason: 'empty' };
  }
  if (!mainWindow || mainWindow.isDestroyed()) return { sent: false, reason: 'main-window-missing' };
  mainWindow.webContents.send('l26:reader-data', {
    caseId,
    tramite,
    text,
    url: String(result?.url || view.webContents.getURL()),
    title: String(result?.title || view.webContents.getTitle()),
    mode: selectionOnly ? 'selection' : 'page',
  });
  sendReaderState(context, { status: selectionOnly ? 'Área seleccionada enviada a L-26.' : 'Página enviada a L-26.' });
  return { sent: true };
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
  else if (command === 'read-page') void readRemotePage(context, 'page').catch(error => sendReaderState(context, { status: `No se pudo leer: ${error.message}` }));
  else if (command === 'read-selection') void readRemotePage(context, 'selection').catch(error => sendReaderState(context, { status: `No se pudo leer: ${error.message}` }));
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
