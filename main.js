const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let isManualCheck = false;
let aboutWindow = null;

function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Про програму',
    parent: BrowserWindow.getAllWindows()[0],
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-about.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  aboutWindow.loadFile('about.html');
  aboutWindow.setMenu(null);

  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
  });

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets/icons/icon.ico')
  });

  mainWindow.loadFile('index.html');

  const sendStatusToWindow = (text) => {
    mainWindow.webContents.send('update-status', text);
  };

  const menuTemplate = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { label: 'Про програму', click: createAboutWindow },
        { type: 'separator' },
        { role: 'services', label: 'Сервіси' },
        { type: 'separator' },
        { role: 'hide', label: 'Сховати' },
        { role: 'hideothers', label: 'Сховати інші' },
        { role: 'unhide', label: 'Показати всі' },
        { type: 'separator' },
        { label: 'Вихід', role: 'quit' }
      ]
    }] : []),
    {
      label: 'Файл',
      submenu: [
        process.platform === 'darwin' ? { role: 'close', label: 'Закрити вікно' } : { label: 'Вихід', role: 'quit' }
      ]
    },
    {
      label: 'Довідка',
      submenu: [
        {
          label: 'Перевірити оновлення',
          click: () => {
            isManualCheck = true;
            autoUpdater.checkForUpdates();
          }
        },
        ...(process.platform !== 'darwin' ? [
          { type: 'separator' },
          { label: 'Про програму', click: createAboutWindow }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  autoUpdater.on('checking-for-update', () => {
    if (isManualCheck) {
      sendStatusToWindow('Перевірка оновлень...');
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (isManualCheck) {
      sendStatusToWindow(`Доступна нова версія ${info.version}. Завантаження...`);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (isManualCheck) {
      sendStatusToWindow('Встановлено останню версію.');
      isManualCheck = false;
    }
  });

  autoUpdater.on('error', (err) => {
    if (isManualCheck) {
      sendStatusToWindow(`Помилка під час оновлення: ${err.message}`);
      isManualCheck = false;
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (isManualCheck) {
      let log_message = `Швидкість завантаження: ${Math.round(progressObj.bytesPerSecond / 1024)} КБ/с`;
      log_message = log_message + ` - Завантажено ${Math.round(progressObj.percent)}% (${Math.round(progressObj.transferred / 1024)}/${Math.round(progressObj.total / 1024)} КБ)`;
      sendStatusToWindow(log_message);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (isManualCheck) {
      sendStatusToWindow('Оновлення завантажено. Воно буде встановлено після перезапуску програми.');
    }
    isManualCheck = false;
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Оновлення готове',
      message: 'Нова версія програми завантажена. Перезапустіть програму, щоб застосувати оновлення.',
      buttons: ['Перезапустити зараз', 'Пізніше']
    }).then(buttonIndex => {
      if (buttonIndex.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdates();
  });
}

app.whenReady().then(() => {
  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
