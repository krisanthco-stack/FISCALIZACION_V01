'use strict';

const { ipcRenderer } = require('electron');

const commandFor = {
  readerBack: 'back',
  readerForward: 'forward',
  readerReload: 'reload',
  readerReadPage: 'read-page',
  readerReadArea: 'read-area',
  readerClose: 'close',
};

function send(command) {
  ipcRenderer.send('l26:reader-command', { command });
}

function setState(state = {}) {
  const address = document.getElementById('readerAddress');
  const title = document.getElementById('readerTitle');
  const status = document.getElementById('readerStatus');
  const back = document.getElementById('readerBack');
  const forward = document.getElementById('readerForward');
  const readPage = document.getElementById('readerReadPage');
  const readArea = document.getElementById('readerReadArea');
  if (address) address.textContent = state.url || '';
  if (title) title.textContent = state.caseLabel || 'Fuente del expediente';
  if (status) status.textContent = state.status || (state.loading ? 'Cargando…' : 'Listo');
  if (back) back.disabled = !state.canGoBack;
  if (forward) forward.disabled = !state.canGoForward;
  if (readPage) readPage.disabled=Boolean(state.loading);
  if (readArea) readArea.disabled=Boolean(state.loading);
}

document.addEventListener('DOMContentLoaded', () => {
  for (const [id, command] of Object.entries(commandFor)) {
    document.getElementById(id)?.addEventListener('click', () => send(command));
  }
});

ipcRenderer.on('l26:reader-state', (_event, state) => setState(state));
