const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // User Studio specific APIs
  openExternal: (url) => {
    // This will be handled by the main process
    window.open(url, '_blank');
  },
  
  // Audit Manifest specific APIs
  exportData: (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Print functionality
  print: () => {
    window.print();
  }
});

// Add Electron-specific styling
document.addEventListener('DOMContentLoaded', () => {
  // Add electron class to body for CSS targeting
  document.body.classList.add('electron-app');
  
  // Add platform-specific class
  ipcRenderer.invoke('get-platform').then(platform => {
    document.body.classList.add(`platform-${platform}`);
  });
  
  // Add version info to console
  ipcRenderer.invoke('get-app-version').then(version => {
    console.log(`OAMTM Desktop App v${version}`);
  });
});
