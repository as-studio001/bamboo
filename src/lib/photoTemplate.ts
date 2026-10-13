// 首頁電腦版照片索引的四種版型（2026-10-13 新增）：先依圖片內容分「照片」「圖說」，再依寬高分
// 橫式／直式，各自套進固定比例的框，讓同一類的圖顯示成一樣大小（見 PhotoStream.tsx）。
// 比例依現有檔案訂的：手機拍的現場照都是 4:3、設計圖多半接近 4:3、組裝說明書 PDF 是 A 規格
// 直式（1:1.414，取整成 5:7）。
// - 照片：框填滿（object-cover，從中間裁切）
// - 圖說：不裁切（object-contain），整張圖完整放進框裡——裁掉尺寸標註或文字就沒有意義了；圖說多半
//   是白底，框裡多出來的留白跟背景融在一起，看起來還是一樣大的框
export type ImageKind = "photo" | "drawing";

export const TEMPLATES: Record<ImageKind, { landscape: number; portrait: number; fit: "cover" | "contain" }> = {
  photo: { landscape: 4 / 3, portrait: 3 / 4, fit: "cover" },
  drawing: { landscape: 4 / 3, portrait: 5 / 7, fit: "contain" },
};

// 寬高比 ≥ 1（含正方形）算橫式，其餘算直式
export function templateRatio(kind: ImageKind, imageRatio: number) {
  return imageRatio >= 1 ? TEMPLATES[kind].landscape : TEMPLATES[kind].portrait;
}

// 自動判斷照片或圖說：把圖縮小畫進 canvas，算「接近純白」的像素比例，一半以上就當圖說
// （設計圖、平面圖多半是白底線稿）。用現有 16 張圖驗證過：照片最高 33%（黑白的編竹照），
// 白底圖說 72%～91%；唯一判斷錯的是整張上色、沒有白底的彩色配置圖，在後台手動指定成「圖說」即可。
const DRAWING_WHITE_RATIO = 0.5;
const kindCache = new Map<string, ImageKind>();

export function detectImageKind(img: HTMLImageElement): ImageKind {
  const key = img.currentSrc || img.src;
  const cached = kindCache.get(key);
  if (cached) return cached;
  let kind: ImageKind = "photo";
  try {
    const w = 96;
    const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let white = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.min(data[i], data[i + 1], data[i + 2]) > 235) white++;
      }
      if (white / (w * h) >= DRAWING_WHITE_RATIO) kind = "drawing";
    }
  } catch {
    // 讀不到像素（例如跨網域圖片）就當照片
  }
  kindCache.set(key, kind);
  return kind;
}
