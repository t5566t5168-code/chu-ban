export type FileError = 'unsupported-extension' | 'invalid-utf8' | 'read-failed' | 'invalid-document' | 'no-text' | 'protected-document' | 'too-large';
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const supportedExtensions = ['txt', 'pdf', 'epub'];
export type OpenResult =
  | { status: 'cancelled' }
  | { status: 'success'; fileName: string; text: string; encoding?: string }
  | { status: 'binary'; fileName: string; bytes: Uint8Array }
  | { status: 'error'; code: FileError };
export interface ReaderAPI { openTextFile(): Promise<OpenResult> }
export const OPEN_TEXT_FILE = 'reader:open-text-file';
export const errorMessages: Record<FileError, string> = {
  'unsupported-extension': '請選擇 TXT、PDF 或 EPUB 檔案。',
  'invalid-utf8': '無法辨識文字編碼，請使用 UTF-8 或 GBK／GB18030 的 TXT 檔案。',
  'read-failed': '無法讀取檔案，請確認檔案仍存在且具有讀取權限，再試一次。',
  'invalid-document': '無法解析這份文件，檔案可能損壞或格式不受支援。',
  'no-text': '找不到可閱讀的文字。掃描圖片 PDF 暫不支援 OCR，請改用含文字的文件。',
  'protected-document': '此文件需要密碼或含受保護的內容，暫不支援。',
  'too-large': '文件超過這一版的處理上限：單檔 50 MB、PDF 1,000 頁、EPUB 解壓文字 20 MB。'
};
