// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { ModelClient } from '../src/renderer/model-client';
import { translationSegments } from '../src/renderer/model-protocol';
function mockWorker() {
  return { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null as null | ((event: MessageEvent) => void), onerror: null as null | (() => void) };
}
it('splits long sentences without truncating content or breaking emoji', () => {
  const text = '長句😀'.repeat(180) + '。最後一句！';
  const parts = translationSegments(text);
  expect(parts.join('')).toBe(text);
  expect(parts.every(part => Array.from(part).length <= 80)).toBe(true);
});
it('does not create a worker until requested and reuses it for successive translations', async () => {
  const worker = mockWorker(); const create = vi.fn(() => worker as unknown as Worker);
  const client = new ModelClient(create); expect(create).not.toHaveBeenCalled();
  const progress = vi.fn(); const first = client.translate('你好', progress);
  const firstId = worker.postMessage.mock.calls[0][0].id;
  worker.onmessage!({ data: { id: firstId, type: 'progress', text: '50%' } } as MessageEvent);
  expect(progress).toHaveBeenCalledWith('50%');
  worker.onmessage!({ data: { id: firstId, type: 'result', text: 'Hello' } } as MessageEvent);
  await expect(first).resolves.toBe('Hello');
  client.cancelPending(); expect(worker.terminate).not.toHaveBeenCalled();
  const second = client.translate('世界', progress);
  worker.onmessage!({ data: { id: firstId, type: 'result', text: 'stale' } } as MessageEvent);
  worker.onmessage!({ data: { id: worker.postMessage.mock.calls[1][0].id, type: 'result', text: 'World' } } as MessageEvent);
  await expect(second).resolves.toBe('World'); expect(create).toHaveBeenCalledOnce(); client.cancel();
});
it('cancels active downloads and inference by terminating the worker', async () => {
  const worker = mockWorker(); const client = new ModelClient(() => worker as unknown as Worker);
  const pending = client.translate('你好', vi.fn());
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  client.cancel(); await rejected; expect(worker.terminate).toHaveBeenCalledOnce();
});
it('releases a crashed worker and permits a fresh retry', async () => {
  const worker = mockWorker(); const create = vi.fn(() => worker as unknown as Worker);
  const client = new ModelClient(create);
  const pending = client.translate('你好', vi.fn()); const rejected = expect(pending).rejects.toThrow('記憶體');
  worker.onerror!(); await rejected;
  expect(worker.terminate).toHaveBeenCalledOnce();
  const retry = client.translate('你好', vi.fn()); const cancelled = expect(retry).rejects.toMatchObject({name:'AbortError'});
  expect(create).toHaveBeenCalledTimes(2); client.cancel(); await cancelled;
});
it('ignores a queued error from an already terminated worker', async () => {
  const old = mockWorker(); const fresh = mockWorker();
  const create = vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh);
  const client = new ModelClient(create);
  const first = client.translate('甲', vi.fn()); const cancelled = expect(first).rejects.toMatchObject({name:'AbortError'});
  client.cancel(); await cancelled;
  const next = client.translate('乙', vi.fn()); old.onerror!();
  fresh.onmessage!({data:{id:fresh.postMessage.mock.calls[0][0].id,type:'result',text:'B'}} as MessageEvent);
  await expect(next).resolves.toBe('B'); expect(fresh.terminate).not.toHaveBeenCalled(); client.cancel();
});
