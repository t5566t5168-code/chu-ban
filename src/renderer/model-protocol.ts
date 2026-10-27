export type ModelRequest = { id: number; text: string; runtime: string };
export type ModelReply = { id: number; type: 'progress' | 'result' | 'error'; text: string };
export const LOCAL_LIMIT = 500;
// Short segments avoid silently truncating the model's input token window.
export function translationSegments(text: string): string[] {
  const sentences = text.match(/[^。！？!?\n]+[。！？!?\n]*|[。！？!?\n]+/gu) ?? [];
  return sentences.flatMap(sentence => {
    const chars = Array.from(sentence);
    const parts: string[] = [];
    while (chars.length) parts.push(chars.splice(0, 80).join(''));
    return parts;
  }).filter(part => part.trim());
}
