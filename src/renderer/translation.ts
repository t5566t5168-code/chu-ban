export const demoSource = 'Reading gives us a place to go when we have to stay where we are.';
export const demoTranslations: Record<string, string> = {
  'zh-Hant': '閱讀讓我們即使身在原地，也能走向別處。',
  en: demoSource,
  ja: '読書は、その場にいながら別の場所へ行く機会を与えてくれます。'
};
export function mountTranslation(root: Document) {
  const panel = root.querySelector<HTMLElement>('#translation-panel')!;
  const source = root.querySelector<HTMLTextAreaElement>('#translation-source')!;
  const target = root.querySelector<HTMLSelectElement>('#translation-language')!;
  const result = root.querySelector<HTMLElement>('#translation-result')!;
  const run = root.querySelector<HTMLButtonElement>('#translate-run')!;
  const content = root.querySelector<HTMLElement>('#reading-content')!;
  const toggle = root.querySelector<HTMLButtonElement>('#translation-toggle')!;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const resetResult = () => { clearTimeout(timer); run.disabled = false; result.textContent = '選取閱讀區的文字，或輸入一段原文，再點「模擬翻譯」。'; };
  function open() { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); }
  root.addEventListener('selectionchange', () => {
    const selection = root.getSelection();
    if (!selection || selection.isCollapsed || !content.contains(selection.anchorNode) || !content.contains(selection.focusNode)) return;
    source.value = selection.toString().slice(0, 2000);
    resetResult(); open();
  });
  toggle.addEventListener('click', () => { open(); source.focus(); });
  root.querySelector('#translation-close')!.addEventListener('click', () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); });
  source.addEventListener('input', resetResult);
  target.addEventListener('change', resetResult);
  root.querySelector('#translation-example')!.addEventListener('click', () => { source.value = demoSource; resetResult(); });
  run.addEventListener('click', () => {
    if (!source.value.trim()) { result.textContent = '請先選取或輸入要翻譯的文字。'; source.focus(); return; }
    result.textContent = '正在模擬翻譯…'; run.disabled = true;
    timer = setTimeout(() => {
      result.textContent = source.value.trim() === demoSource
        ? `示範譯文（預設資料）\n\n${demoTranslations[target.value]}`
        : `操作預覽完成 · 目標語言：${target.selectedOptions[0].textContent}\n\n正式接入翻譯服務後，這裡會顯示所選原文的譯文。目前未執行真實翻譯，也未傳送任何文字。\n\n可點「填入示範句」體驗預設譯文。`;
      run.disabled = false;
    }, 350);
  });
  return { reset() { resetResult(); source.value = ''; panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }, open };
}
