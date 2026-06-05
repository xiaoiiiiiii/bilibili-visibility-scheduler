/**
 * Electron 主进程入口
 * 负责窗口管理、系统托盘、IPC 注册、调度器生命周期
 */
import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { IPC } from '../shared/ipc-channels';
import { registerAuthIPC } from './ipc/auth.ipc';
import { registerVideosIPC } from './ipc/videos.ipc';
import { registerTasksIPC } from './ipc/tasks.ipc';
import { registerSchedulerIPC } from './ipc/scheduler.ipc';
import { SchedulerService } from './services/scheduler.service';
import { CredentialService } from './services/credential.service';
import { AppSettings } from '../shared/types';

// 全局引用
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let schedulerService: SchedulerService;
let isQuitting = false;
let appSettings: AppSettings;

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development';

/** 加载应用设置 */
function loadSettings(): AppSettings {
  const saved = CredentialService.getSettings();
  return {
    theme: (saved.theme as AppSettings['theme']) || 'light',
    autoStart: saved.autoStart || false,
    minimizeToTray: saved.minimizeToTray !== false,
  };
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'B站视频可见性定时器',
    icon: path.join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    frame: true,
    show: false,
  });

  // 开发环境加载 Vite dev server
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    if (appSettings.minimizeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  // 创建托盘图标（使用内置图标作为回退）
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
  let trayIcon: Electron.NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    // 回退：创建一个简单的 16x16 图标
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  tray.setToolTip('B站视频可见性定时器');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: '切换主题',
      click: () => {
        const newTheme = appSettings.theme === 'dark' ? 'light' : 'dark';
        appSettings.theme = newTheme;
        CredentialService.setTheme(newTheme);
        mainWindow?.webContents.send(IPC.THEME_SET, newTheme);
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });
}

function registerAllIPC(): void {
  // 初始化调度器
  schedulerService = new SchedulerService(mainWindow);

  // 注册各模块 IPC
  registerAuthIPC();
  registerVideosIPC(mainWindow);
  registerTasksIPC(schedulerService);
  registerSchedulerIPC(schedulerService);

  // 主题 IPC
  ipcMain.handle(IPC.THEME_GET, () => appSettings.theme);
  ipcMain.handle(IPC.THEME_SET, (_event, theme: string) => {
    appSettings.theme = theme as AppSettings['theme'];
    CredentialService.setTheme(theme);
  });

  // 应用设置 IPC
  ipcMain.handle(IPC.APP_GET_SETTINGS, () => appSettings);
  ipcMain.handle(IPC.APP_SET_SETTINGS, (_event, settings: Partial<AppSettings>) => {
    appSettings = { ...appSettings, ...settings };
    if (settings.autoStart !== undefined) {
      CredentialService.setSetting('autoStart', settings.autoStart);
      app.setLoginItemSettings({ openAtLogin: settings.autoStart });
    }
    if (settings.minimizeToTray !== undefined) {
      CredentialService.setSetting('minimizeToTray', settings.minimizeToTray);
    }
    if (settings.theme !== undefined) {
      CredentialService.setTheme(settings.theme);
    }
  });
}

// 应用生命周期
app.whenReady().then(() => {
  // 去掉 Electron 默认英文菜单栏，增强沉浸感
  Menu.setApplicationMenu(null);

  appSettings = loadSettings();
  createMainWindow();   // 先创建窗口，确保 mainWindow 引用有效
  registerAllIPC();     // 再注册 IPC，使各模块能正常推送日志
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  schedulerService?.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
