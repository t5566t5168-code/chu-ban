export const demoSource = 'Reading gives us a place to go when we have to stay where we are.';
interface LocalTranslator {
  translate(text: string): Promise<string>;
  destroy(): void;
}
interface TranslatorFactory {
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor(monitor: { addEventListener(type: 'downloadprogress', listener: (event: { loaded: number }) => void): void }): void;
  }): Promise<LocalTranslator>;
}
const unsupported = '此瀏覽器未提供內建翻譯。請用最新版桌面 Chrome 開啟 HTTPS 網站；手機與部分內嵌瀏覽器目前不支援。';
export function mountTranslation(root: Document) {
  const panel = root.querySelector<HTMLElement>('#translation-panel')!;
  const source = root.querySelector<HTMLTextAreaElement>('#translation-source')!;
  const from = root.querySelector<HTMLSelectElement>('#translation-source-language')!;
  const target = root.querySelector<HTMLSelectElement>('#translation-language')!;
  const result = root.querySelector<HTMLElement>('#translation-result')!;
  const run = root.querySelector<HTMLButtonElement>('#translate-run')!;
  const content = root.querySelector<HTMLElement>('#reading-content')!;
  const toggle = root.querySelector<HTMLButtonElement>('#translation-toggle')!;
  const factory = (root.defaultView as (Window & { Translator?: TranslatorFactory }) | null)?.Translator;
  let generation = 0;
  let active: LocalTranslator | undefined;
  const released = new WeakSet<LocalTranslator>();
  const release = (translator: LocalTranslator) => {
    if (!released.has(translator)) { released.add(translator); translator.destroy(); }
  };
  const resetResult = () => {
    generation++;
    if (active) release(active);
    active = undefined;
    run.disabled = !factory;
    result.textContent = factory ? '選擇原文與目標語言，再點「翻譯」。首次使用會下載語言模型，請保持網路連線。' : unsupported;
  };
  function open() { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); }
  root.addEventListener('selectionchange', () => {
    const selection = root.getSelection();
    if (!selection || selection.isCollapsed || !content.contains(selection.anchorNode) || !content.contains(selection.focusNode)) return;
    source.value = selection.toString().slice(0, 2000);
    resetResult(); open();
  });
  toggle.addEventListener('click', () => { open(); source.focus(); });
  root.querySelector('#translation-close')!.addEventListener('click', () => { resetResult(); panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); });
  source.addEventListener('input', resetResult);
  from.addEventListener('change', resetResult);
  target.addEventListener('change', resetResult);
  root.querySelector('#translation-example')!.addEventListener('click', () => { source.value = demoSource; from.value = 'en'; target.value = 'zh-Hant'; resetResult(); });
  run.addEventListener('click', async () => {
    if (!factory) { result.textContent = unsupported; return; }
    const text = source.value.trim();
    if (!text) { result.textContent = '請先選取或輸入要翻譯的文字。'; source.focus(); return; }
    if (text.length > 2000) { result.textContent = '每次最多翻譯 2,000 字，請縮短原文。'; return; }
    resetResult();
    if (from.value === target.value) { result.textContent = '原文與目標語言相同，無須翻譯。\n\n' + text; return; }
    const job = generation;
    const current = () => job === generation;
    run.disabled = true;
    result.textContent = '正在準備 Chrome 翻譯模型；首次使用可能需要下載，請稍候…';
    let translator: LocalTranslator | undefined;
    try {
      // Call create directly inside the click gesture: model download requires user activation.
      translator = await factory.create({
        sourceLanguage: from.value, targetLanguage: target.value,
        monitor(monitor) {
          monitor.addEventListener('downloadprogress', event => {
            if (current()) result.textContent = `正在下載翻譯模型：${Math.round(Math.min(1, Math.max(0, event.loaded)) * 100)}%`;
          });
        }
      });
      if (!current()) return;
      active = translator;
      result.textContent = '正在裝置上翻譯…';
      const translated = await translator.translate(text);
      if (current()) result.textContent = translated || '未取得譯文，請縮短原文後重試。';
    } catch (error) {
      if (current()) {
        const name = typeof error === 'object' && error !== null && 'name' in error ? String(error.name) : '';
        result.textContent = name === 'NotSupportedError'
          ? 'Chrome 目前無法使用這組語言。請確認原文語言、更新桌面 Chrome，或改選其他目標語言。'
          : '翻譯或模型下載失敗。請檢查網路與可用磁碟空間，並確認 Chrome 允許內建翻譯，再按「翻譯」重試。';
      }
    } finally {
      if (translator && (active === translator || !current())) {
        release(translator);
        if (active === translator) active = undefined;
      }
      if (current()) run.disabled = false;
    }
  });
  resetResult();
  return { reset() { resetResult(); source.value = ''; panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }, open };
}
