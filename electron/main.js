const { app, BrowserWindow, Menu, globalShortcut, ipcMain, screen, dialog, powerMonitor, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Keep a global reference of the window object
let mainWindow;
let violationLog = [];
let isExamActive = false;
let violationCount = 0;
let maxViolations = 5; // Auto-submit after 5 violations
let examData = null;
let encryptedAnswers = null;

// Security monitoring
let lastMousePosition = { x: 0, y: 0 };
let mouseMoveCount = 0;
let lastActivityTime = Date.now();
let suspiciousActivityDetected = false;
let networkDisconnected = false;

function createWindow() {
  // Get the primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Check for multiple monitors
  const displays = screen.getAllDisplays();
  if (displays.length > 1) {
    logViolation('multiple_monitors', `Multiple monitors detected: ${displays.length} displays`, 'high');
  }

  // Create the browser window with maximum security
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    fullscreen: true,
    frame: false, // Remove window frame for kiosk mode
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true,
    kiosk: true, // Enable kiosk mode
    show: false, // Don't show until ready-to-show
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // Additional security
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    icon: path.join(__dirname, '../build/favicon.ico')
  });

  // Show window only when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Force fullscreen after showing
    mainWindow.setFullScreen(true);
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  const startUrl = isDev
    ? `file://${path.join(__dirname, 'src/renderer/index.html')}` // Local HTML file
    : `file://${path.join(__dirname, 'src/renderer/index.html')}`; // Production - also local HTML

  mainWindow.loadURL(startUrl);

  // Prevent DevTools opening
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
    logViolation('dev_tools', 'DevTools opened and closed', 'high');
  });

  // Open DevTools in development only
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // ===== WINDOW & SCREEN CONTROL =====

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    logViolation('window_open_attempt', 'Attempted to open new window', 'high');
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs - only allow exam domain
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    const allowedHosts = ['localhost', '127.0.0.1'];
    const isAllowed = parsedUrl.protocol === 'file:' ||
                     (parsedUrl.protocol === 'http:' && allowedHosts.includes(parsedUrl.hostname));

    if (!isAllowed) {
      event.preventDefault();
      logViolation('navigation_attempt', `Attempted navigation to: ${url}`, 'high');
    }
  });

  // Monitor for fullscreen exit attempts
  mainWindow.on('leave-full-screen', () => {
    logViolation('fullscreen_exit', 'User attempted to exit fullscreen', 'high');
    mainWindow.setFullScreen(true);
  });

  // Monitor window focus/blur
  mainWindow.on('blur', () => {
    if (isExamActive) {
      // Send violation event to renderer
      mainWindow.webContents.send('window-blur-detected');
      mainWindow.focus();
      // Force focus back
      setTimeout(() => mainWindow.focus(), 100);
    }
  });

  // Monitor minimize attempts
  mainWindow.on('minimize', () => {
    if (isExamActive) {
      logViolation('window_minimize', 'Attempted to minimize window', 'high');
      mainWindow.restore();
    }
  });

  // ===== KEYBOARD & MOUSE CONTROL =====
  // OS Limitations: Some system-level shortcuts (e.g., Alt+Tab on Windows, Cmd+Tab on Mac) may still be intercepted by the OS before reaching Electron,
  // especially in kiosk mode. However, Electron blocking provides additional security layer. Task switching is primarily prevented by kiosk mode.

  // Prevent context menu
  mainWindow.webContents.on('context-menu', (event) => {
    event.preventDefault();
    logViolation('context_menu', 'Right-click context menu attempted', 'low');
  });

  // Comprehensive keyboard blocking
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();

    // Block dangerous key combinations
    if (input.control && (
      key === 'c' || key === 'v' || key === 'x' ||
      key === 'a' || key === 'r' || key === 't' ||
      key === 'n' || key === 'w' || key === 'q' ||
      key === 'shift' || key === 'u' || key === 'i' ||
      key === 'j' || key === 'k' || key === 'h' ||
      (input.shift && key === 'i') // Ctrl+Shift+I (DevTools)
    )) {
      event.preventDefault();
      logViolation('keyboard_shortcut', `Blocked Ctrl${input.shift ? '+Shift' : ''}+${key.toUpperCase()}`, 'medium');
    }

    // Block Alt combinations
    if (input.alt && (
      key === 'tab' || key === 'f4' || key === 'escape' ||
      key === 'space' || key === 'enter'
    )) {
      event.preventDefault();
      logViolation('alt_shortcut', `Blocked Alt+${key.toUpperCase()}`, 'high');
    }

    // Block function keys
    if (key.startsWith('f') && key.length <= 3 && key !== 'f1') {
      event.preventDefault();
      logViolation('function_key', `Blocked ${key.toUpperCase()}`, 'medium');
    }

    // Block F12 (DevTools), F11 (fullscreen toggle), F5 (refresh)
    if (key === 'f12' || key === 'f11' || key === 'f5') {
      event.preventDefault();
      logViolation('dev_tools_attempt', `Blocked ${key.toUpperCase()}`, 'high');
    }

    // Block PrintScreen
    if (key === 'printscreen' || input.code === 'PrintScreen') {
      event.preventDefault();
      logViolation('printscreen', 'PrintScreen blocked', 'high');
    }

    // Block Windows key
    if (input.meta || input.code === 'MetaLeft' || input.code === 'MetaRight') {
      event.preventDefault();
      logViolation('windows_key', 'Windows key pressed', 'high');
    }

    // Block Escape
    if (key === 'escape') {
      event.preventDefault();
      logViolation('escape_key', 'Escape key blocked', 'medium');
    }
  });

  // ===== BROWSER RESTRICTION =====

  // Disable text selection
  mainWindow.webContents.on('select-all', (event) => {
    if (isExamActive) {
      event.preventDefault();
    }
  });

  // Monitor DOM events for security
  mainWindow.webContents.executeJavaScript(`
    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      if (window.isExamActive) e.preventDefault();
    });

    // Disable copy/paste
    document.addEventListener('copy', (e) => {
      if (window.isExamActive) e.preventDefault();
    });

    document.addEventListener('paste', (e) => {
      if (window.isExamActive) e.preventDefault();
    });

    // Disable drag and drop
    document.addEventListener('dragstart', (e) => {
      if (window.isExamActive) e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
      if (window.isExamActive) e.preventDefault();
    });
  `);

  // ===== APPLICATION-LEVEL MONITORING =====

  // Monitor mouse activity and suspicious behavior
  let mouseMonitorInterval = setInterval(() => {
    if (!isExamActive) return;

    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastActivityTime;

    // Check for suspicious inactivity (could indicate screen recording)
    if (timeSinceLastActivity > 30000) { // 30 seconds
      logViolation('suspicious_inactivity', 'Unusual period of inactivity detected', 'medium');
      suspiciousActivityDetected = true;
    }

    // Check for excessive mouse movement (could indicate automation)
    if (mouseMoveCount > 1000) { // Arbitrary threshold
      logViolation('excessive_mouse_movement', 'Unusual mouse activity detected', 'medium');
    }

    // Reset activity tracking
    lastActivityTime = currentTime;
    mouseMoveCount = 0;
  }, 10000); // Check every 10 seconds

  // Monitor power events
  powerMonitor.on('suspend', () => {
    if (isExamActive) {
      logViolation('system_suspend', 'System suspended during exam', 'high');
    }
  });

  powerMonitor.on('resume', () => {
    if (isExamActive) {
      logViolation('system_resume', 'System resumed during exam', 'medium');
      // Force window focus
      setTimeout(() => mainWindow.focus(), 1000);
    }
  });

  // Monitor display changes
  screen.on('display-added', () => {
    logViolation('display_added', 'Additional display connected', 'high');
  });

  screen.on('display-removed', () => {
    logViolation('display_removed', 'Display disconnected', 'high');
  });

  // Clean up on window close
  mainWindow.on('closed', () => {
    clearInterval(mouseMonitorInterval);
    mainWindow = null;
  });
}

// IPC handlers for communication with renderer
ipcMain.handle('start-exam-monitoring', (event, examInfo) => {
  isExamActive = true;
  violationLog = []; // Reset violation log
  violationCount = 0;
  examData = examInfo;
  lastActivityTime = Date.now();
  suspiciousActivityDetected = false;

  // Register comprehensive global shortcuts to block
  const shortcuts = [
    'Alt+Tab',
    'Alt+F4',
    'Alt+Escape',
    'Ctrl+Shift+Esc', // Task Manager
    'Ctrl+Alt+Delete', // Security screen
    'Super+Tab', // Linux
    'Super+L', // Lock screen
    'Super+D', // Show desktop
    'Super+A', // Action center
    'PrintScreen',
    'Alt+PrintScreen'
  ];

  shortcuts.forEach(shortcut => {
    try {
      globalShortcut.register(shortcut, () => {
        logViolation('global_shortcut_blocked', `${shortcut} blocked`, 'high');
      });
    } catch (error) {
      console.warn(`Failed to register shortcut ${shortcut}:`, error);
    }
  });

  // Set exam active flag in renderer
  mainWindow.webContents.executeJavaScript('window.isExamActive = true;');

  return { success: true, maxViolations };
});

ipcMain.handle('stop-exam-monitoring', () => {
  isExamActive = false;

  // Unregister all global shortcuts
  globalShortcut.unregisterAll();

  // Clear exam data
  const finalViolations = [...violationLog];
  violationLog = [];
  examData = null;

  // Set exam inactive flag in renderer
  mainWindow.webContents.executeJavaScript('window.isExamActive = false;');

  return { success: true, violations: finalViolations };
});

ipcMain.handle('log-violation', (event, violation) => {
  logViolation(violation.type, violation.description, violation.severity);

  // Check if we should auto-submit
  if (violationCount >= maxViolations) {
    // Auto-submit exam
    mainWindow.webContents.send('auto-submit-exam', {
      reason: 'max_violations_exceeded',
      violationCount
    });
  }
});

ipcMain.handle('get-violations', () => {
  return violationLog;
});

ipcMain.handle('set-max-violations', (event, max) => {
  maxViolations = max;
  return { success: true };
});

ipcMain.handle('encrypt-answers', (event, answers) => {
  try {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(JSON.stringify(answers), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    encryptedAnswers = { data: encrypted, key: key.toString('hex'), iv: iv.toString('hex') };
    return { success: true, id: encryptedAnswers.key };
  } catch (error) {
    logViolation('encryption_error', 'Failed to encrypt answers', 'high');
    return { success: false, error: error.message };
  }
});

ipcMain.handle('decrypt-answers', (event, id) => {
  try {
    if (!encryptedAnswers || encryptedAnswers.key !== id) {
      return { success: false, error: 'Invalid encryption ID' };
    }

    const decipher = crypto.createDecipher('aes-256-cbc', Buffer.from(encryptedAnswers.key, 'hex'));
    let decrypted = decipher.update(encryptedAnswers.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return { success: true, answers: JSON.parse(decrypted) };
  } catch (error) {
    logViolation('decryption_error', 'Failed to decrypt answers', 'high');
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-multiple-monitors', () => {
  const displays = screen.getAllDisplays();
  const multipleMonitors = displays.length > 1;

  if (multipleMonitors) {
    logViolation('multiple_monitors', `Multiple monitors detected: ${displays.length} displays`, 'high');
  }

  return { multipleMonitors, count: displays.length, displays };
});

ipcMain.handle('check-network-status', async () => {
  // Simple network check - in production, use a more robust method
  try {
    const response = await require('http').get('http://www.google.com');
    const hasNetwork = response.statusCode === 200;
    networkDisconnected = !hasNetwork;

    if (!hasNetwork) {
      logViolation('network_disconnected', 'Network connection lost', 'medium');
    }

    return { connected: hasNetwork };
  } catch (error) {
    networkDisconnected = true;
    logViolation('network_error', 'Network check failed', 'medium');
    return { connected: false };
  }
});

ipcMain.handle('force-fullscreen', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setFullScreen(true);
    mainWindow.focus();
  }
  return { success: true };
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.versions,
    displays: screen.getAllDisplays().length,
    memory: process.getSystemMemoryInfo(),
    uptime: process.uptime()
  };
});

// Violation logging function
function logViolation(type, description, severity = 'medium') {
  const violation = {
    type,
    description,
    severity,
    timestamp: new Date().toISOString(),
    processInfo: process.platform,
    examId: examData?.id || null
  };

  violationLog.push(violation);
  violationCount++;

  console.log('VIOLATION DETECTED:', violation);

  // Send violation to renderer process
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('violation-detected', violation);
  }

  // Auto-submit logic for severe violations
  if (severity === 'high' && violationCount >= 3) {
    console.log('HIGH SEVERITY VIOLATION - AUTO-SUBMIT TRIGGERED');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-submit-exam', {
        reason: 'severe_violation',
        violation: violation
      });
    }
  } else if (violationCount >= maxViolations) {
    console.log('MAX VIOLATIONS EXCEEDED - AUTO-SUBMIT TRIGGERED');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auto-submit-exam', {
        reason: 'max_violations_exceeded',
        violationCount
      });
    }
  }

  // Save violations to file for persistence
  saveViolationsToFile();
}

// Save violations to encrypted file
function saveViolationsToFile() {
  try {
    const violationFile = path.join(app.getPath('userData'), 'violations.enc');
    const data = JSON.stringify({
      examId: examData?.id,
      violations: violationLog,
      timestamp: new Date().toISOString()
    });

    // Simple encryption for the file
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('seb-lite-encryption-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend IV for decryption
    const encryptedData = iv.toString('hex') + ':' + encrypted;
    fs.writeFileSync(violationFile, encryptedData);
  } catch (error) {
    console.error('Failed to save violations:', error);
  }
}

// Load violations from file
function loadViolationsFromFile() {
  try {
    const violationFile = path.join(app.getPath('userData'), 'violations.enc');
    if (fs.existsSync(violationFile)) {
      const encryptedData = fs.readFileSync(violationFile, 'utf8');
      const [ivHex, encrypted] = encryptedData.split(':');
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync('seb-lite-encryption-key', 'salt', 32);
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const data = JSON.parse(decrypted);
      if (data.examId === examData?.id) {
        violationLog = data.violations || [];
        violationCount = violationLog.length;
      }
    }
  } catch (error) {
    console.error('Failed to load violations:', error);
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  // Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Load any saved violations on startup
  loadViolationsFromFile();
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent app from being killed easily
app.on('before-quit', (event) => {
  if (isExamActive) {
    event.preventDefault();
    logViolation('app_close_attempt', 'Attempted to close application during exam', 'high');
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Exam in Progress',
      message: 'Cannot close application while exam is active.',
      buttons: ['OK']
    });
  }
});

// Handle crashes and recovery
app.on('renderer-process-crashed', (event, webContents, killed) => {
  logViolation('renderer_crash', 'Renderer process crashed', 'high');
  if (isExamActive && examData) {
    // Attempt recovery
    console.log('Attempting to recover from crash...');
    setTimeout(() => {
      if (mainWindow && mainWindow.isDestroyed()) {
        createWindow();
      }
    }, 2000);
  }
});

app.on('child-process-crashed', (event, contents, killed) => {
  logViolation('child_process_crash', 'Child process crashed', 'high');
});

// Disable hardware acceleration for better security monitoring
app.disableHardwareAcceleration();

// Additional security measures
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    logViolation('new_window_attempt', `Blocked navigation to: ${navigationUrl}`, 'high');
  });

  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedHosts = ['localhost', '127.0.0.1'];
    const isAllowed = parsedUrl.protocol === 'file:' ||
                     (parsedUrl.protocol === 'http:' && allowedHosts.includes(parsedUrl.hostname));

    if (!isAllowed) {
      event.preventDefault();
      logViolation('external_navigation', `Blocked external navigation to: ${navigationUrl}`, 'high');
    }
  });

  // Prevent DevTools in production
  contents.on('devtools-opened', () => {
    if (!isDev) {
      contents.closeDevTools();
      logViolation('devtools_opened', 'Developer tools opened in production', 'high');
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logViolation('uncaught_exception', `Uncaught exception: ${error.message}`, 'high');
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logViolation('unhandled_rejection', `Unhandled rejection: ${reason}`, 'high');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
