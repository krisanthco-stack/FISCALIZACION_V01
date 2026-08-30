'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('l26Desktop', {
  openSource: payload => ipcRenderer.invoke('l26:open-source', payload),
  onReaderData: callback => ipcRenderer.on('l26:reader-data', (_event, payload) => callback(payload)),
  onReaderError: callback => ipcRenderer.on('l26:reader-error', (_event, payload) => callback(payload)),
});
