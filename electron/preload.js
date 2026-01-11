const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Exam monitoring controls
  startExamMonitoring: (examInfo) => ipcRenderer.invoke('start-exam-monitoring', examInfo),
  stopExamMonitoring: () => ipcRenderer.invoke('stop-exam-monitoring'),

  // Violation logging
  logViolation: (violation) => ipcRenderer.invoke('log-violation', violation),
  getViolations: () => ipcRenderer.invoke('get-violations'),
  setMaxViolations: (max) => ipcRenderer.invoke('set-max-violations', max),

  // Encrypted answer storage
  encryptAnswers: (answers) => ipcRenderer.invoke('encrypt-answers', answers),
  decryptAnswers: (id) => ipcRenderer.invoke('decrypt-answers', id),

  // Security checks
  checkMultipleMonitors: () => ipcRenderer.invoke('check-multiple-monitors'),
  checkNetworkStatus: () => ipcRenderer.invoke('check-network-status'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Window controls
  forceFullscreen: () => ipcRenderer.invoke('force-fullscreen'),

  // Event listeners for violations
  onViolationDetected: (callback) => {
    ipcRenderer.on('violation-detected', callback);
    // Return cleanup function
    return () => ipcRenderer.removeListener('violation-detected', callback);
  },

  // Auto-submit event listener
  onAutoSubmit: (callback) => {
    ipcRenderer.on('auto-submit-exam', callback);
    return () => ipcRenderer.removeListener('auto-submit-exam', callback);
  },

  // Window blur event listener
  onWindowBlur: (callback) => {
    ipcRenderer.on('window-blur-detected', callback);
    return () => ipcRenderer.removeListener('window-blur-detected', callback);
  },

  // System information (limited for security)
  getPlatform: () => process.platform,
  getVersion: () => process.versions,

  // Safe dialog for development/testing only
  showTestDialog: (message) => {
    if (process.env.NODE_ENV === 'development') {
      ipcRenderer.invoke('show-test-dialog', message);
    }
  }
});

// Additional security: Remove any existing globals that might be dangerous
delete window.require;
delete window.exports;
delete window.module;

// Prevent access to Node.js APIs
Object.defineProperty(window, 'require', {
  get: () => { throw new Error('require is not defined'); },
  set: () => { throw new Error('require cannot be set'); },
  configurable: false
});

Object.defineProperty(window, 'process', {
  get: () => ({
    platform: process.platform,
    versions: { node: process.versions.node, chrome: process.versions.chrome, electron: process.versions.electron }
  }),
  set: () => { throw new Error('process cannot be modified'); },
  configurable: false
});

// Prevent access to dangerous globals
['global', 'Buffer', 'setImmediate', 'clearImmediate'].forEach(prop => {
  Object.defineProperty(window, prop, {
    get: () => { throw new Error(`${prop} is not available in secure mode`); },
    set: () => { throw new Error(`${prop} cannot be modified`); },
    configurable: false
  });
});
