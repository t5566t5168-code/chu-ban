import { expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({
  load: vi.fn().mockResolvedValue(undefined),
  chat: vi.fn().mockResolvedValue({ choices: [{ finish_reason: 'stop', message: { content: '今日は晴れです。' } }] })
}));
vi.mock('@wllama/wllama', () => ({ Wllama: class {
  setCompat() {}
  loadModelFromUrl = mock.load;
  createChatCompletion = mock.chat;
} }));
it('loads lazily, selects the target language, reuses the model and rejects truncated results', async () => {
  const worker = { onmessage: undefined as any, postMessage: vi.fn() };
  vi.stubGlobal('self', worker);
  try {
    await import('../src/renderer/hy.worker');
    expect(mock.load).not.toHaveBeenCalled();
    await worker.onmessage({ data: { id: 1, text: 'Sunny today.', target: 'ja', runtime: 'https://example.com/runtime/' } });
    expect(mock.chat.mock.calls[0][0].messages[0].content).toContain('Japanese');
    expect(worker.postMessage).toHaveBeenCalledWith({ id: 1, type: 'result', text: '今日は晴れです。' });
    mock.chat.mockResolvedValueOnce({ choices: [{ finish_reason: 'length', message: { content: 'partial' } }] });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await worker.onmessage({ data: { id: 2, text: 'Sunny today.', target: 'zh-Hant', runtime: 'https://example.com/runtime/' } });
    expect(mock.load).toHaveBeenCalledOnce();
    expect(worker.postMessage.mock.calls.at(-1)?.[0]).toMatchObject({ id: 2, type: 'error' });
    error.mockRestore();
  } finally { vi.unstubAllGlobals(); }
});
