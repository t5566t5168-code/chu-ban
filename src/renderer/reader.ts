import { errorMessages, type ReaderAPI } from '../shared/reader';

export function mountReader(root: Document, api: ReaderAPI) {
  const welcome = root.querySelector<HTMLElement>('#welcome')!;
  const reader = root.querySelector<HTMLElement>('#reader')!;
  const content = root.querySelector<HTMLElement>('#reading-content')!;
  const name = root.querySelector<HTMLElement>('#filename')!;
  const title = root.querySelector<HTMLElement>('#reading-title')!;
  const empty = root.querySelector<HTMLElement>('#empty')!;
  const message = root.querySelector<HTMLElement>('#status')!;
  const viewport = root.querySelector<HTMLElement>('#viewport')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-open]')];
  let busy = false;
  let hasFile = false;
  async function openFile() {
    if (busy) return;
    busy = true;
    buttons.forEach(button => { button.disabled = true; });
    message.textContent = '正在開啟檔案…';
    try {
      const result = await api.openTextFile();
      if (result.status === 'success') {
        content.textContent = result.text;
        name.textContent = result.fileName;
        name.title = result.fileName;
        title.textContent = result.fileName;
        empty.hidden = result.text.trim().length !== 0;
        content.hidden = !empty.hidden;
        welcome.hidden = true;
        reader.hidden = false;
        hasFile = true;
        viewport.scrollTop = 0;
        title.focus({ preventScroll: true });
        message.textContent = empty.hidden ? '已開啟檔案。' : '此檔案沒有可閱讀的內容。';
      } else if (result.status === 'error') {
        message.textContent = errorMessages[result.code];
      } else { message.textContent = ''; }
    } catch { message.textContent = errorMessages['read-failed']; }
    finally {
      busy = false;
      buttons.forEach(button => { button.disabled = false; });
      buttons[0].textContent = hasFile ? '更換文字檔 ↗' : '開啟文字檔 ↗';
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => void openFile()));
  root.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
      event.preventDefault(); void openFile();
    }
  });
  return { openFile };
}
