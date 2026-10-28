import { Wllama } from '@wllama/wllama';
import type { ModelRequest, ModelReply } from './model-protocol';

const names: Record<string, string> = { en: 'English', 'zh-Hant': 'Traditional Chinese', 'zh-Hans': 'Simplified Chinese', ja: 'Japanese' };
let model: Wllama | undefined;
let busy = false;
self.onmessage = async ({ data }: MessageEvent<ModelRequest>) => {
  if (busy) return;
  busy = true;
  const send = (type: ModelReply['type'], text: string) => self.postMessage({ id: data.id, type, text });
  try {
    if (!names[data.target ?? ''] || data.text.length > 500 || !data.text.trim()) throw new Error('Invalid input');
    if (!model) {
      send('progress', '正在下載 Hy-MT2（約 1.13 GB），首次使用請耐心等候…');
      model = new Wllama({ default: new URL('wllama.wasm', data.runtime).href }, { suppressNativeLog: true });
      model.setCompat(null);
      await model.loadModelFromUrl('https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/resolve/a0c709d/Hy-MT2-1.8B-Q4_K_M.gguf', {
        n_ctx: 2048, n_threads: 1, n_gpu_layers: 0,
        progressCallback: ({ loaded, total }) => send('progress', `下載 Hy-MT2：${total ? Math.floor(loaded / total * 100) : 0}%（${Math.round(loaded / 1e6)} MB）。下載後還需載入模型。`)
      });
    }
    send('progress', '正在裝置上使用 Hy-MT2 翻譯；可按「停止」取消…');
    const reply = await model.createChatCompletion({
      messages: [{ role: 'user', content: `Translate the following text into ${names[data.target!]}. Note that you should only output the translated result without any additional explanation:\n${data.text}` }],
      max_tokens: 768, temperature: 0.7, top_p: 0.6, top_k: 20
    });
    const choice = reply.choices[0];
    if (choice.finish_reason === 'length') throw new Error('Output limit');
    const text = choice.message.content;
    if (!text?.trim()) throw new Error('Empty output');
    send('result', text.trim());
  } catch (error) {
    console.error('Hy-MT2 failed', error);
    send('error', 'Hy-MT2 翻譯未完成。請縮短原文，確認網路、磁碟空間與記憶體充足，或改選輕量模型。');
  } finally { busy = false; }
};
