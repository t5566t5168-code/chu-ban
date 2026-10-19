import { app, BrowserWindow, dialog, ipcMain, session } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { OPEN_TEXT_FILE, type OpenResult } from '../shared/reader';
import { readTextFile } from './read-file';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
let window: BrowserWindow | null = null;
let opening = false;
const rendererFile = join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
const rendererURL = MAIN_WINDOW_VITE_DEV_SERVER_URL || pathToFileURL(rendererFile).href;

function createWindow() {
  window = new BrowserWindow({
    width: 1120, height: 820, minWidth: 460, minHeight: 520,
    title: '留白 · TXT 閱讀器', backgroundColor: '#f7f6f2', autoHideMenuBar: true,
    webPreferences: { preload: join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  window.setMenu(null);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.on('closed', () => { window = null; });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) void window.loadURL(rendererURL);
  else void window.loadFile(rendererFile);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  ipcMain.handle(OPEN_TEXT_FILE, async (event): Promise<OpenResult> => {
    if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || event.senderFrame.url !== rendererURL) {
      return { status: 'error', code: 'read-failed' };
    }
    if (opening) return { status: 'cancelled' };
    opening = true;
    try {
      const result = await dialog.showOpenDialog(window, {
        title: '開啟 TXT 檔案', buttonLabel: '開啟',
        properties: ['openFile'], filters: [{ name: 'UTF-8 文字檔', extensions: ['txt'] }]
      });
      if (result.canceled || !result.filePaths[0]) return { status: 'cancelled' };
      return await readTextFile(result.filePaths[0]);
    } catch { return { status: 'error', code: 'read-failed' }; }
    finally { opening = false; }
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
