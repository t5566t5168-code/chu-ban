export type FileError = 'unsupported-extension' | 'invalid-utf8' | 'read-failed';
export type OpenResult =
  | { status: 'cancelled' }
  | { status: 'success'; fileName: string; text: string }
  | { status: 'error'; code: FileError };
export interface ReaderAPI { openTextFile(): Promise<OpenResult> }
export const OPEN_TEXT_FILE = 'reader:open-text-file';
export const errorMessages: Record<FileError, string> = {
  'unsupported-extension': '請選擇 .txt 文字檔案。',
  'invalid-utf8': '無法開啟：僅支援 UTF-8 編碼的 TXT 檔案。',
  'read-failed': '無法讀取檔案，請確認檔案仍存在且具有讀取權限，再試一次。'
};
