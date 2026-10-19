import { contextBridge, ipcRenderer } from 'electron';
import { OPEN_TEXT_FILE, type ReaderAPI } from '../shared/reader';
const reader: ReaderAPI = { openTextFile: () => ipcRenderer.invoke(OPEN_TEXT_FILE) };
contextBridge.exposeInMainWorld('reader', reader);
