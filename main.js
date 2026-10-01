'use strict';

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, nativeImage, screen } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const exporter = require('./lib/exporter');
const { writeIcons } = require('./lib/icon');

const ROOT = __dirname;
const APP_NAME = '进阶工作台';
const CONTENT_DIR = path.join(ROOT, 'content');
const BUILD_DIR = path.join(ROOT, 'build');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let trayBalloonShown = false;

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    restoreWindow(true);
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.whenReady().then(start);
}

function ensureIcons() {
  const icoPath = path.join(BUILD_DIR, 'icon.ico');
  const iconPath = path.join(BUILD_DIR, 'icon.png');
  const trayPath = path.join(BUILD_DIR, 'tray.png');
  if (!fs.existsSync(iconPath) || !fs.existsSync(trayPath) || !fs.existsSync(icoPath)) {
    try { writeIcons(BUILD_DIR); } catch (err) { console.error('icon generation failed', err); }
  }
  // Windows 下 .ico 在任务栏/窗口上的显示效果最好
  return { iconPath: fs.existsSync(icoPath) ? icoPath : iconPath, trayPath };
}

function start() {
  if (process.platform === 'win32') app.setAppUserModelId('com.advancedworkbench.app');

  const { iconPath, trayPath } = ensureIcons();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    backgroundColor: '#0b0f1a',
    title: APP_NAME,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(ROOT, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(ROOT, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    hideToTray();
  });

  mainWindow.on('close', () => {
    isQuitting = true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    destroyPdfWindow();
    app.quit();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = String(input.key || '').toLowerCase();
    if ((input.control && input.shift && key === 'i') || key === 'f12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });

  createTray(trayPath);
  registerIpc();
}

function createTray(trayPath) {
  let image = nativeImage.createFromPath(trayPath);
  if (image.isEmpty()) {
    image = nativeImage.createFromPath(path.join(BUILD_DIR, 'icon.png'));
  }
  tray = new Tray(image);

  const menu = Menu.buildFromTemplate([
    { label: '显示主界面', click: () => restoreWindow(true) },
    { type: 'separator' },
    { label: '打开下载目录', click: () => openDownloadDir() },
    { label: '打开程序目录', click: () => shell.openPath(ROOT) },
    { type: 'separator' },
    { label: '关于', click: () => restoreWindow(true).then(() => mainWindow && mainWindow.webContents.send('nav:about')) },
    { type: 'separator' },
    { label: '退出程序', click: () => quitApp() }
  ]);

  tray.setToolTip(APP_NAME + ' · 双击显示主界面');
  tray.setContextMenu(menu);
  tray.on('double-click', () => restoreWindow(true));
  tray.on('click', () => restoreWindow(true));
}

function restoreWindow(focus) {
  return new Promise((resolve) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      resolve(false);
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    // 统一无条件 show()：窗口可能已被隐藏到托盘，这里确保一定重新显示。
    mainWindow.show();
    if (focus) {
      // Windows 下从托盘恢复的窗口不一定自动置前，用一次置顶切换强制提到最前。
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.focus();
    }
    resolve(true);
  });
}

function hideToTray() {
  if (!mainWindow) return;
  mainWindow.hide();
  if (!trayBalloonShown && tray && process.platform === 'win32') {
    trayBalloonShown = true;
    try {
      tray.displayBalloon({
        title: APP_NAME,
        content: '程序已最小化到系统托盘，仍在后台运行。\n双击托盘图标可恢复窗口；点击「关闭按钮」则完全退出程序。'
      });
    } catch (err) { /* 部分系统不支持气泡提示，忽略 */ }
  }
}

function quitApp() {
  isQuitting = true;
  destroyPdfWindow();
  if (tray) { tray.destroy(); tray = null; }
  app.quit();
}

function openExternal(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) return;
  if (/[^\x00-\x7F]/.test(url)) {
    try { url = encodeURI(url); } catch (err) { /* 保留原样 */ }
  }
  shell.openExternal(url);
}

function downloadDir() {
  const dir = path.join(app.getPath('documents'), APP_NAME + '资料');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function openDownloadDir() {
  const dir = downloadDir();
  shell.openPath(dir);
  return dir;
}

function loadCatalog() {
  const site = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'site.json'), 'utf8'));
  const categories = [];
  for (const file of fs.readdirSync(CONTENT_DIR)) {
    if (!/^cat-.*\.json$/.test(file)) continue;
    const cat = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
    categories.push(cat);
  }
  categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  return { site, categories };
}

function resourceStats(cats) {
  const stats = { ppt: 0, doc: 0, video: 0, book: 0, projects: 0, modules: 0, lessons: 0 };
  for (const cat of cats) {
    for (const key of ['ppt', 'doc', 'video', 'book']) {
      stats[key] += ((cat.resources && cat.resources[key]) || []).length;
    }
    stats.projects += (cat.projects || []).length;
    stats.modules += (cat.toc || []).length;
    for (const mod of cat.toc || []) stats.lessons += (mod.lessons || []).length;
  }
  stats.total = stats.ppt + stats.doc + stats.video + stats.book;
  return stats;
}

async function saveWithDialog(options, buffer) {
  const result = await dialog.showSaveDialog(mainWindow, options);
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  fs.writeFileSync(result.filePath, buffer);
  return { ok: true, path: result.filePath };
}

// PDF 导出窗口：只创建一次并复用。
// 每次导出都新建 BrowserWindow 会导致第二次导出报 ERR_FAILED，因此这里复用同一个隐藏窗口。
let pdfWindow = null;

function getPdfWindow() {
  if (pdfWindow && !pdfWindow.isDestroyed()) return pdfWindow;
  pdfWindow = new BrowserWindow({
    show: false,
    skipTaskbar: true,
    webPreferences: { javascript: false, contextIsolation: true, nodeIntegration: false }
  });
  pdfWindow.on('closed', () => { pdfWindow = null; });
  return pdfWindow;
}

function destroyPdfWindow() {
  if (pdfWindow && !pdfWindow.isDestroyed()) pdfWindow.destroy();
  pdfWindow = null;
}

async function renderPdf(html) {
  const win = getPdfWindow();
  const tmp = path.join(os.tmpdir(), 'lws-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.html');
  fs.writeFileSync(tmp, html, 'utf8');
  try {
    await win.loadFile(tmp);
    await new Promise((resolve) => setTimeout(resolve, 320));
    return await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
    });
  } finally {
    try { fs.unlinkSync(tmp); } catch (err) { /* ignore */ }
  }
}

function registerIpc() {
  ipcMain.handle('catalog:load', () => {
    const { site, categories } = loadCatalog();
    return { site, categories, stats: resourceStats(categories), version: app.getVersion() };
  });

  ipcMain.handle('shell:open', (event, url) => {
    openExternal(url);
    return true;
  });

  ipcMain.handle('shell:openPath', (event, target) => shell.openPath(target));

  ipcMain.handle('app:openDownloadDir', () => openDownloadDir());

  ipcMain.handle('app:openProgramDir', () => shell.openPath(ROOT));

  ipcMain.handle('app:info', () => ({
    name: APP_NAME,
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    programDir: ROOT,
    downloadDir: downloadDir()
  }));

  ipcMain.handle('window:hide', () => { hideToTray(); return true; });
  ipcMain.handle('window:quit', () => { quitApp(); return true; });

  ipcMain.handle('export:save', async (event, payload) => {
    const { site, categories } = loadCatalog();
    const format = payload && payload.format;

    if (format === 'bundle') {
      const buf = exporter.buildBundle(ROOT, categories, site);
      return saveWithDialog({
        title: '保存全部资料包',
        defaultPath: path.join(downloadDir(), '进阶工作台-全部资料包.zip'),
        filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }]
      }, buf);
    }

    if (format === 'resources-all') {
      const buf = Buffer.from(exporter.buildCsv(categories, site), 'utf8');
      return saveWithDialog({
        title: '保存全部资源清单',
        defaultPath: path.join(downloadDir(), '进阶工作台-全部资源清单.csv'),
        filters: [{ name: 'CSV 表格', extensions: ['csv'] }]
      }, buf);
    }

    if (format === 'starter') {
      const buf = exporter.buildStarterZip(ROOT, categories);
      return saveWithDialog({
        title: '保存项目示例代码包',
        defaultPath: path.join(downloadDir(), '进阶工作台-项目示例.zip'),
        filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }]
      }, buf);
    }

    const cat = categories.find((c) => c.id === payload.categoryId);
    if (!cat) return { ok: false, error: '未找到对应分类' };
    const base = exporter.safeName(cat.name);

    if (format === 'pdf') {
      const html = exporter.buildHtml(cat, site);
      const buf = await renderPdf(html);
      return saveWithDialog({
        title: '保存 PDF 手册',
        defaultPath: path.join(downloadDir(), base + '-学习手册.pdf'),
        filters: [{ name: 'PDF 文档', extensions: ['pdf'] }]
      }, buf);
    }

    if (format === 'md' || format === 'html' || format === 'pptx' || format === 'csv') {
      let buf;
      let ext = format;
      let label = '';
      if (format === 'md') {
        buf = Buffer.from(exporter.buildMarkdown(cat, site), 'utf8');
        label = 'Markdown 笔记';
      } else if (format === 'html') {
        buf = Buffer.from(exporter.buildHtml(cat, site), 'utf8');
        label = 'HTML 手册';
      } else if (format === 'pptx') {
        buf = exporter.buildDeck(cat, site);
        label = 'PPT 大纲';
      } else {
        const lines = ['资料类型,标题,提供方,难度,链接,说明'];
        for (const row of exporter.resourcesFlat(cat)) {
          lines.push([row.kind, row.title, row.provider, row.level, row.url, row.note]
            .map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(','));
        }
        buf = Buffer.from('\ufeff' + lines.join('\r\n'), 'utf8');
        label = '资源清单';
      }
      const filters = {
        md: [{ name: 'Markdown', extensions: ['md'] }],
        html: [{ name: 'HTML 网页', extensions: ['html'] }],
        pptx: [{ name: 'PowerPoint', extensions: ['pptx'] }],
        csv: [{ name: 'CSV 表格', extensions: ['csv'] }]
      }[format];
      return saveWithDialog({
        title: '保存' + label,
        defaultPath: path.join(downloadDir(), base + '-' + label + '.' + ext),
        filters
      }, buf);
    }

    return { ok: false, error: '不支持的格式' };
  });

  ipcMain.handle('export:revealAfterSave', (event, filePath) => {
    if (filePath && fs.existsSync(filePath)) shell.showItemInFolder(filePath);
    return true;
  });
}