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

// 文字長度決定這個章節最多能上傳／顯示幾張照片——使用者訂的規則：前 200 字允許 3 張，
// 之後每多滿 100 字再多 2 張（未滿 100 字的零頭不計）。目的是避免圖片量跟論述文字的份量
// 脫節——論述還很單薄卻塞十幾張照片，讀起來會像圖庫而不是有內容支撐的策展論述。
// 這是唯一的判斷依據，後台上傳流程（到了上限，上傳介面該擋下來、引導使用者改傳到
// MORE IN DETAIL）跟這裡的顯示防呆（見下方 visibleImages()）都算同一個數字，不用各自
// 實作一次、也不會兩邊講的上限對不上。
export function maxPhotosForText(text: string | undefined): number {
  const length = [...(text ?? "")].length;
  if (length <= 200) return 3;
  return 3 + 2 * Math.floor((length - 200) / 100);
}

// chapter.images 本來就只該存「文字撐得起」的張數——真的超過上限的部分，資料上應該直接
// 搬去 moreImages，不是留在 images 裡等著被裁掉（見 projects.ts 的欄位說明）。這裡的
// slice() 純粹是最後一道防呆：如果資料一時沒對齊規則（例如文字改短了、還沒來得及搬移
// 照片），畫面上還是不會顯示出超過上限的張數。案例內頁的自動排版、首頁雙欄的照片索引都
// 呼叫同一個函式，不用各自算一次上限。
export function visibleImages(text: string | undefined, images: ProjectImage[] | undefined): ProjectImage[] {
  return (images ?? []).slice(0, maxPhotosForText(text));
}

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
  align: "end" | "start"; // 同一排照片各自維持真實比例、高度不一定一樣，這個決定矮的
  // 那張要「底部切齊」還是「頂部切齊」貼向高的那張，見下面 applyRowAlignment() 的說明。
};

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "photo-solo"; photo: PhotoWithRatio }
  | { type: "photo-row"; row: PhotoRow };

// 把一組已知比例的照片切成一組一組——照抄 render.js 的 makePhotoChunks()，但（已修正）
// 每組最多 2 張，不會出現「三張並排」的模式：三張混合方向並排時，欄寬權重比例（7:7:4 這類）
// 換算成實際版面反而常常留下一大塊不成比例的空白（曾經真的長這樣），兩張並排的欄寬比例
// 差距小很多，不會有這個問題，直接把「最多幾張」的上限從 3 壓到 2，從源頭排除這個情況，
// 不用另外修飾三張並排時的樣式。
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
      while (j < photos.length && orientationOf(photos[j].ratio) === "portrait" && j - i < 2) j++;
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

  // 收尾：落單的一張併進旁邊那一組——只在鄰居也剛好是「單張」時才併（併完剛好兩張），
  // 不會併出三張以上的組。全景照除外（那是刻意獨立的單張整排，不參與合併）。鄰居已經是
  // 兩張的話就不併了，讓這張落單的照片自己獨立成一整排（見 chunkToRow：單張一律當
  // 「單張大圖」處理，不會有「圖片旁邊留白」的問題，跟原本擔心的狀況不衝突）。
  for (let k = 0; k < chunks.length; k++) {
    if (chunks[k].length !== 1) continue;
    if (orientationOf(chunks[k][0].ratio) === "panorama") continue;
    const nextIsSingle =
      k + 1 < chunks.length && chunks[k + 1].length === 1 && orientationOf(chunks[k + 1][0].ratio) !== "panorama";
    const prevIsSingle =
      k - 1 >= 0 && chunks[k - 1].length === 1 && orientationOf(chunks[k - 1][0].ratio) !== "panorama";
    if (nextIsSingle) {
      chunks[k + 1] = chunks[k].concat(chunks[k + 1]);
      chunks.splice(k, 1);
      k--;
    } else if (prevIsSingle) {
      chunks[k - 1] = chunks[k - 1].concat(chunks[k]);
      chunks.splice(k, 1);
      k--;
    }
  }
  return chunks;
}

function chunkToRow(chunk: PhotoWithRatio[], ratioState: RatioState): PhotoRow {
  // align 這裡先給預設值，實際結果由下面的 applyRowAlignment() 統一決定
  // （要看整個章節的區塊序列、不是單一組照片自己能判斷的）。
  if (chunk.length === 1) {
    return { photos: chunk, columns: [1], portrait: orientationOf(chunk[0].ratio) === "portrait", align: "end" };
  }

  const orientations = chunk.map((p) => orientationOf(p.ratio));
  const allPortrait = orientations.every((o) => o === "portrait");
  const allNonPortrait = orientations.every((o) => o !== "portrait");

  if (allPortrait) {
    return { photos: chunk, columns: chunk.map(() => 1), portrait: true, align: "end" };
  }
  if (allNonPortrait && chunk.length === 2) {
    let idx = ratioState.next % PAIR_RATIOS.length;
    if (idx === ratioState.last) idx = (idx + 1) % PAIR_RATIOS.length;
    ratioState.last = idx;
    ratioState.next++;
    return { photos: chunk, columns: [...PAIR_RATIOS[idx]], portrait: false, align: "end" };
  }
  // 混合方向（落單照片併組後的結果）：欄寬照每張自己的方向權重分配。
  return { photos: chunk, columns: orientations.map((o) => ORIENTATION_WEIGHT[o]), portrait: false, align: "end" };
}

function rowToBlock(row: PhotoRow): ContentBlock {
  if (row.photos.length === 1) return { type: "photo-solo", photo: row.photos[0] };
  return { type: "photo-row", row };
}

// 連續兩排以上的照片區塊中間沒有文字隔開時（插入位置剛好湊在同一段落前後），每排照片各自
// 維持真實比例，高度不一定一樣，統一「底部切齊」的話，矮的那張會在整排的上方留一塊空白，
// 跟緊接在它前面那排的下緣中間會卡出一段沒有理由的死白（曾經真的長這樣，使用者截圖抓到過
// 兩次：先是抓到完全沒指定對齊、整塊被 grid 拉伸留白的版本；改成統一底部切齊後，又抓到
// 「連續兩排」這個情境本身還是留白，只是白的位置換到中間）。
//
// 解法是讓相鄰的連續排「交替」對齊方向——第一排底部切齊、緊接著的第二排改頂部切齊，兩排
// 矮的那張因此都貼向彼此中間的接縫，原本躲不掉的留白被推到最外側（第一排的頂端、最後一排
// 的底端），那裡本來就緊接著段落文字或下一段內容，留白看起來就像正常的區塊間距，不會卡在
// 兩排照片正中間顯得莫名其妙。單獨一排（前後都是文字或只有它自己）維持預設的底部切齊。
function applyRowAlignment(blocks: ContentBlock[]): void {
  let previousWasRow = false;
  let previousAlign: "end" | "start" = "end";
  for (const block of blocks) {
    if (block.type !== "photo-row") {
      previousWasRow = false;
      continue;
    }
    const align: "end" | "start" = previousWasRow ? (previousAlign === "end" ? "start" : "end") : "end";
    block.row.align = align;
    previousAlign = align;
    previousWasRow = true;
  }
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
    const blocks = rows.map(rowToBlock);
    applyRowAlignment(blocks);
    return blocks;
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
  applyRowAlignment(blocks);
  return blocks;
}
