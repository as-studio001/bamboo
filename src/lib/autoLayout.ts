import type { ContentBlock, ProjectImage } from "@/lib/projects";

// 種子化的簡單亂數產生器（mulberry32）——同一組輸入（章節 key）永遠得到同一個結果，SSR／CSR
// 算出來的版面才會一致（重新整理不會跳動）；不同章節的 key 字串雜湊出來的種子不同，排出來的
// 節奏也不同，這就是「篇章差異」的來源，不用手動一個個排。
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 自動把一段文字（已依 \n\n 拆成段落）跟一組照片排成「段落—圖片—段落—圖片…」的區塊序列，
// 比照 Internal-Pages（as-studio001/Internal-Pages，
// https://as-studio001.github.io/Internal-Pages/?case=laogu-fang）的圖文編輯節奏——圖片
// 有時候單張大圖、有時候兩張並排，插入的位置不是每段文字後面都塞一張，疏密由亂數決定。
// seedKey 通常傳 chapter.key：同一章節每次算出來的結果都一樣（不會每次重新整理版面就跳動），
// 不同章節彼此的種子不同，節奏自然不同，做出「篇章差異、有呼吸感」的效果，不用逐章手動排版。
export function autoLayoutBlocks(seedKey: string, paragraphs: string[], images: ProjectImage[]): ContentBlock[] {
  const cleanParagraphs = paragraphs.map((t) => t.trim()).filter(Boolean);
  if (cleanParagraphs.length === 0) {
    return images.length > 0 ? [{ type: "images", images }] : [];
  }
  if (images.length === 0) {
    return cleanParagraphs.map((text) => ({ type: "paragraph", text }));
  }

  const random = mulberry32(hashSeed(seedKey));

  // 1. 把照片切成一組一組（每組 1～2 張）——圖片多的章節比較有機會湊成「兩張並排」，
  //    但不是每次都湊雙，保留單張大圖的呼吸感，不會變成規律的「永遠都兩張一組」。
  const groups: ProjectImage[][] = [];
  for (let i = 0; i < images.length; ) {
    const remaining = images.length - i;
    const pairUp = remaining >= 2 && random() < 0.55;
    const size = pairUp ? 2 : 1;
    groups.push(images.slice(i, i + size));
    i += size;
  }

  // 2. 決定每組圖片插在哪一段文字後面——沿段落數大致平均分布，但加一點隨機抖動，避免每個
  //    章節都是「精確等分」這種太規律、太像公式算出來的排法。最早插在第一段之後（先讓論述
  //    鋪陳一下，不要一開場就先塞圖），最晚插在最後一段之後。
  const maxSlot = cleanParagraphs.length;
  const rawSlots = groups.map((_, i) => {
    const evenSlot = ((i + 1) / (groups.length + 1)) * maxSlot;
    const jitter = (random() - 0.5) * Math.min(1.6, maxSlot * 0.6);
    return evenSlot + jitter;
  });

  let previousSlot = 0;
  const slots = rawSlots.map((raw) => {
    const clamped = Math.max(previousSlot + 1, Math.min(maxSlot, Math.round(raw)));
    previousSlot = clamped;
    return clamped;
  });

  // 3. 組裝最終的段落／圖片交錯序列。
  const blocks: ContentBlock[] = [];
  let groupIndex = 0;
  cleanParagraphs.forEach((text, i) => {
    blocks.push({ type: "paragraph", text });
    const paragraphNumber = i + 1;
    while (groupIndex < groups.length && slots[groupIndex] === paragraphNumber) {
      blocks.push({ type: "images", images: groups[groupIndex] });
      groupIndex++;
    }
  });
  while (groupIndex < groups.length) {
    blocks.push({ type: "images", images: groups[groupIndex] });
    groupIndex++;
  }

  return blocks;
}
