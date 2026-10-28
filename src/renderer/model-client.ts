import type { ModelReply } from './model-protocol';
export class ModelClient {
  private worker?: Worker;
  private sequence = 0;
  private pending?: { id: number; resolve: (text: string) => void; reject: (error: Error) => void; progress: (text: string) => void };
  constructor(private createWorker = () => new Worker(new URL('./translation.worker.ts', import.meta.url), { type: 'module' })) {}
  translate(text: string, progress: (text: string) => void, target = 'en'): Promise<string> {
    if (this.pending) this.cancel();
    return new Promise((resolve, reject) => {
      try {
        if (!this.worker) {
          const worker = this.createWorker();
          this.worker = worker;
          worker.onmessage = (event: MessageEvent<ModelReply>) => {
            if (this.worker !== worker) return;
            const message = event.data;
            const job = this.pending;
            if (!job || job.id !== message.id) return;
            if (message.type === 'progress') job.progress(message.text);
            else {
              this.pending = undefined;
              if (message.type === 'result') job.resolve(message.text);
              else { job.reject(new Error(message.text)); this.cancel(); }
            }
          };
          worker.onerror = () => {
            if (this.worker !== worker) return;
            const job = this.pending; this.pending = undefined;
            job?.reject(new Error('模型背景程序無法啟動或記憶體不足，請重試。'));
            this.cancel();
          };
        }
        const id = ++this.sequence;
        this.pending = { id, resolve, reject, progress };
        this.worker.postMessage({ id, text, target, runtime: new URL('translation-runtime/', document.baseURI).href });
      } catch {
        this.pending = undefined;
        this.cancel();
        reject(new Error('此瀏覽器無法啟動背景翻譯，請使用新版桌面瀏覽器。'));
      }
    });
  }
  cancel() {
    this.worker?.terminate(); this.worker = undefined;
    this.pending?.reject(new DOMException('Cancelled', 'AbortError'));
    this.pending = undefined;
  }
  cancelPending() { if (this.pending) this.cancel(); }
}
