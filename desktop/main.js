'use strict';

const path = require('node:path');
const { app, BrowserWindow, shell } = require('electron');
const { startLocalServer, stopLocalServer } = require('./server');

const APP_HOST = '127.0.0.1';
const PREFERRED_PORT = 18126;
let localServer = null;
let localOrigin = null;

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
  return win;
}

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
    const win = BrowserWindow.getAllWindows()[0];
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
