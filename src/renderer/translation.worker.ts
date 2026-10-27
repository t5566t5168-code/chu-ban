import { pipeline, env } from '@huggingface/transformers';
import { LOCAL_LIMIT, translationSegments, type ModelRequest, type ModelReply } from './model-protocol';
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.proxy = false;
type Translator = (text: string, options: { max_new_tokens: number; num_beams: number }) => Promise<{ translation_text: string }[]>;
// Narrow the library's all-task union to the translation pipeline used here.
const loadTranslation = pipeline as unknown as (task: 'translation', model: string, options: {
  dtype: 'q8'; device: 'wasm'; revision: string;
  progress_callback: (progress: { status: string; file?: string; progress?: number }) => void;
}) => Promise<Translator>;
let translator: Translator | undefined;
let busy = false;
self.onmessage = async (event: MessageEvent<ModelRequest>) => {
  if (busy) return;
  busy = true;
  const { id, text } = event.data;
  env.backends.onnx.wasm!.wasmPaths = event.data.runtime;
  const send = (type: ModelReply['type'], text: string) => self.postMessage({ id, type, text } satisfies ModelReply);
  try {
    if (!text.trim() || text.length > LOCAL_LIMIT) throw new Error('請輸入 1 至 500 字。');
    if (!translator) {
      send('progress', '正在下載或讀取快取模型…首次下載約 113 MB 模型，另有執行檔，請稍候。');
      translator = await loadTranslation('translation', 'Xenova/opus-mt-zh-en', {
        dtype: 'q8', device: 'wasm', revision: '39d480d',
        progress_callback: progress => {
          if (progress.status === 'progress') send('progress', `下載 ${progress.file}：${Math.round(progress.progress ?? 0)}%（單一檔案）`);
          else if (progress.status === 'done') send('progress', '模型檔案就緒，正在載入…');
        }
      });
    }
    const segments = translationSegments(text);
    const output: string[] = [];
    for (let index = 0; index < segments.length; index++) {
      send('progress', `正在裝置上翻譯 ${index + 1} / ${segments.length} 段…可按「停止」取消。`);
      const response = await translator(segments[index], { max_new_tokens: 256, num_beams: 1 });
      const item = response[0];
      if (!item || !('translation_text' in item) || !item.translation_text.trim()) throw new Error('未取得譯文，請縮短原文再試。');
      output.push(item.translation_text);
    }
    send('result', output.join('\n\n'));
  } catch {
    send('error', '模型下載或翻譯失敗。請檢查網路、儲存空間及可用記憶體，縮短原文後重試；也可切換 Chrome 內建翻譯。');
  } finally { busy = false; }
};
