import type { ProjectImage } from "@/lib/projects";

// 直接照抄 Internal-Pages（as-studio001/Internal-Pages）的 js/render.js——makePhotoChunks()／
// renderContent() 那一段圖文交錯排版邏輯，不是重新發明一套。核心差異相較於之前那版
// 「章節 key 當種子的隨機排版」：這裡完全不擲骰子，「主次關係」是從每張照片真實的寬高比
// （naturalWidth/naturalHeight，見 usePhotosWithRatio.ts）直接算出來的——直幅照片自然收成
// 一組等寬並排、橫幅照片兩張一組但寬窄不對稱並排（模擬視覺上的主圖／副圖關係）、特別寬的
// 全景照獨立佔一整排。「篇章差異、有呼吸感」的來源是每章圖片本身的形狀與張數不同，不是
// 額外加上去的隨機數字——同一組照片、同一段文字，永遠排出同一個結果，不會重新整理就跳動，
// 也不需要用 project.slug／chapter.key 湊種子。
//
// 段落插入位置一樣照抄原版：Math.round(((i+1)*段落數)/(圖片組數+1))，單純沿段落數等分，
// 不加隨機抖動——原始碼裡「有機、不死板」的觀感全部來自圖片分組本身的不規則性，插入位置
// 反而故意用最單純的等分公式，不需要另外調味。

export type Orientation = "portrait" | "square" | "landscape" | "panorama";

// 比例門檻跟權重數字都原封不動照抄 render.js 的 orientationOf()／ORIENTATION_WEIGHT。
export function orientationOf(ratio: number): Orientation {
  if (ratio < 0.85) return "portrait";
  if (ratio > 1.9) return "panorama";
  if (ratio > 1.15) return "landscape";
  return "square";
}

const ORIENTATION_WEIGHT: Record<Orientation, number> = {
  portrait: 4,
  square: 5,
  landscape: 7,
  panorama: 7,
};

// 橫幅兩張並排時的寬窄比例池，輪流取用並避開「跟上一組一樣」，不會每次都同一個節奏
// （照抄 render.js 的 PAIR_RATIOS）。
const PAIR_RATIOS: readonly [number, number][] = [
  [7, 4],
  [4, 7],
  [6, 5],
];

export type PhotoWithRatio = ProjectImage & { ratio: number };

// 橫幅配對的寬窄輪替狀態——照抄 render.js：整個案例頁只有一份 ratioState，「避開跟上一組
// 一樣」才有意義（同一頁後面章節的配對節奏要接續前面章節，不是每章各自從頭來一次，不然
// 「建築設計」「模矩」「構造」「施工」如果剛好都各自只有一組橫幅配對，會變成每章都是同一個
// 7:4，看起來又像制式模板）。ProjectDetail.tsx 建立一份、往下傳給每個 NarrativeSection 共用。
export type RatioState = { next: number; last: number };
export function createRatioState(): RatioState {
  return { next: 0, last: -1 };
}

export type PhotoRow = {
  photos: PhotoWithRatio[];
  columns: number[]; // grid-template-columns 的 fr 權重，跟 photos 一一對應
  portrait: boolean; // 整排都是直幅——沒有真實照片的示意色塊要用 3:4 當預設比例
};

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "photo-solo"; photo: PhotoWithRatio }
  | { type: "photo-row"; row: PhotoRow };

// 把一組已知比例的照片切成一組一組——照抄 render.js 的 makePhotoChunks()。
function makePhotoChunks(photos: PhotoWithRatio[]): PhotoWithRatio[][] {
  const chunks: PhotoWithRatio[][] = [];
  let i = 0;
  while (i < photos.length) {
    const o = orientationOf(photos[i].ratio);
    if (o === "panorama") {
      chunks.push([photos[i]]);
      i += 1;
    } else if (o === "portrait") {
      let j = i + 1;
      while (j < photos.length && orientationOf(photos[j].ratio) === "portrait" && j - i < 3) j++;
      chunks.push(photos.slice(i, j));
      i = j;
    } else if (
      i + 1 < photos.length &&
      orientationOf(photos[i + 1].ratio) !== "portrait" &&
      orientationOf(photos[i + 1].ratio) !== "panorama"
    ) {
      chunks.push(photos.slice(i, i + 2));
      i += 2;
    } else {
      chunks.push([photos[i]]);
      i += 1;
    }
  }

  // 收尾：落單的一張併進旁邊那一組，不會出現「一張圖旁邊留白」的狀況（全景照除外，
  // 那是刻意獨立的單張整排）。
  for (let k = 0; k < chunks.length; k++) {
    if (chunks[k].length !== 1) continue;
    if (orientationOf(chunks[k][0].ratio) === "panorama") continue;
    if (k + 1 < chunks.length && chunks[k + 1].length < 3) {
      chunks[k + 1] = chunks[k].concat(chunks[k + 1]);
      chunks.splice(k, 1);
      k--;
    } else if (k - 1 >= 0 && chunks[k - 1].length < 3) {
      chunks[k - 1] = chunks[k - 1].concat(chunks[k]);
      chunks.splice(k, 1);
      k--;
    }
  }
  return chunks;
}

function chunkToRow(chunk: PhotoWithRatio[], ratioState: RatioState): PhotoRow {
  if (chunk.length === 1) {
    return { photos: chunk, columns: [1], portrait: orientationOf(chunk[0].ratio) === "portrait" };
  }

  const orientations = chunk.map((p) => orientationOf(p.ratio));
  const allPortrait = orientations.every((o) => o === "portrait");
  const allNonPortrait = orientations.every((o) => o !== "portrait");

  if (allPortrait) {
    return { photos: chunk, columns: chunk.map(() => 1), portrait: true };
  }
  if (allNonPortrait && chunk.length === 2) {
    let idx = ratioState.next % PAIR_RATIOS.length;
    if (idx === ratioState.last) idx = (idx + 1) % PAIR_RATIOS.length;
    ratioState.last = idx;
    ratioState.next++;
    return { photos: chunk, columns: [...PAIR_RATIOS[idx]], portrait: false };
  }
  // 混合方向（落單照片併組後的結果）：欄寬照每張自己的方向權重分配。
  return { photos: chunk, columns: orientations.map((o) => ORIENTATION_WEIGHT[o]), portrait: false };
}

function rowToBlock(row: PhotoRow): ContentBlock {
  if (row.photos.length === 1) return { type: "photo-solo", photo: row.photos[0] };
  return { type: "photo-row", row };
}

// 主入口：段落陣列＋已量測比例的照片陣列 → 交錯區塊序列。照抄 render.js 的 renderContent()。
// ratioState 不傳的話會自己開一份新的（單章節獨立測試、Storybook 之類的情境用）；
// ProjectDetail.tsx 會傳同一份給整個案例頁所有章節共用，見上面 RatioState 的說明。
export function layoutChapter(
  paragraphs: string[],
  photos: PhotoWithRatio[],
  ratioState: RatioState = createRatioState(),
): ContentBlock[] {
  const cleanParagraphs = paragraphs.map((t) => t.trim()).filter(Boolean);

  const rows = makePhotoChunks(photos).map((chunk) => chunkToRow(chunk, ratioState));

  if (cleanParagraphs.length === 0) {
    return rows.map(rowToBlock);
  }
  if (photos.length === 0) {
    return cleanParagraphs.map((text) => ({ type: "paragraph", text }));
  }

  const insertAfter = rows.map((_, i) => Math.round(((i + 1) * cleanParagraphs.length) / (rows.length + 1)));

  const blocks: ContentBlock[] = [];
  let rowIndex = 0;
  while (rowIndex < rows.length && insertAfter[rowIndex] === 0) {
    blocks.push(rowToBlock(rows[rowIndex]));
    rowIndex++;
  }
  cleanParagraphs.forEach((text, i) => {
    blocks.push({ type: "paragraph", text });
    while (rowIndex < rows.length && insertAfter[rowIndex] === i + 1) {
      blocks.push(rowToBlock(rows[rowIndex]));
      rowIndex++;
    }
  });
  while (rowIndex < rows.length) {
    blocks.push(rowToBlock(rows[rowIndex]));
    rowIndex++;
  }
  return blocks;
}
