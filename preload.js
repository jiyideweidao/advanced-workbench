'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('workstation', {
  loadCatalog: () => ipcRenderer.invoke('catalog:load'),
  openExternal: (url) => ipcRenderer.invoke('shell:open', url),
  openPath: (target) => ipcRenderer.invoke('shell:openPath', target),
  openDownloadDir: () => ipcRenderer.invoke('app:openDownloadDir'),
  openProgramDir: () => ipcRenderer.invoke('app:openProgramDir'),
  appInfo: () => ipcRenderer.invoke('app:info'),
  save: (payload) => ipcRenderer.invoke('export:save', payload),
  reveal: (filePath) => ipcRenderer.invoke('export:revealAfterSave', filePath),
  hideWindow: () => ipcRenderer.invoke('window:hide'),
  quitApp: () => ipcRenderer.invoke('window:quit'),
  onNavigate: (handler) => {
    ipcRenderer.on('nav:about', () => handler('about'));
  }
});