// 量畫面上某一塊區域「實際看到的背景」有多亮（0＝全黑、1＝全白），給首頁兩側的直書標示決定要用
// 深灰還是淺灰字（2026-10-13 新增，見 EdgeTitle.tsx）。
//
// 做法：在區域內取一組格點，每個點用 document.elementsFromPoint 由上往下找第一個「看得到」的東西——
// - <img>：把圖片縮小畫到 canvas 上（每個網址只畫一次、快取起來），依 object-fit（cover／contain／
//   原生比例）把畫面座標換算回圖片座標，讀那一點的像素亮度。圖片都是本站同網域的檔案，canvas 讀得到
// - 有不透明底色的元素（白色頁面、案例視窗後面的白色遮罩等）：用它的底色亮度
// - 其他（透明容器、還沒載入的圖）：繼續往下找
// 最後把所有點的亮度平均。exclude 是標示本身，量的時候跳過自己。

type Pixels = { data: Uint8ClampedArray; w: number; h: number };
const pixelCache = new Map<string, Pixels | null>();
const SAMPLE_WIDTH = 96;

function imagePixels(img: HTMLImageElement): Pixels | null {
  const src = img.currentSrc || img.src;
  if (!src || !img.complete || !img.naturalWidth) return null;
  if (pixelCache.has(src)) return pixelCache.get(src)!;
  try {
    const w = SAMPLE_WIDTH;
    const h = Math.max(1, Math.round((SAMPLE_WIDTH * img.naturalHeight) / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const pixels = { data: ctx.getImageData(0, 0, w, h).data, w, h };
    pixelCache.set(src, pixels);
    return pixels;
  } catch {
    pixelCache.set(src, null); // 讀不到（例如跨網域）就不再重試
    return null;
  }
}

// 畫面座標 → 圖片上的相對位置（0～1）；落在圖片實際畫出範圍外（contain 的留白）回傳 null。
function toImagePoint(img: HTMLImageElement, x: number, y: number): [number, number] | null {
  const r = img.getBoundingClientRect();
  const fit = getComputedStyle(img).objectFit;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let u: number;
  let v: number;
  if (fit === "cover" || fit === "contain") {
    const scale = fit === "cover" ? Math.max(r.width / iw, r.height / ih) : Math.min(r.width / iw, r.height / ih);
    const left = r.left + (r.width - iw * scale) / 2;
    const top = r.top + (r.height - ih * scale) / 2;
    u = (x - left) / (iw * scale);
    v = (y - top) / (ih * scale);
  } else {
    u = (x - r.left) / r.width;
    v = (y - r.top) / r.height;
  }
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [u, v] : null;
}

function luminance(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function parseOpaqueColor(css: string): number | null {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parseFloat(a) < 0.5) return null;
  return luminance(parseFloat(r), parseFloat(g), parseFloat(b));
}

function pointLuminance(x: number, y: number, exclude: Element): number | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (exclude.contains(el)) continue;
    if (el instanceof HTMLImageElement) {
      const pixels = imagePixels(el);
      const p = pixels && toImagePoint(el, x, y);
      if (pixels && p) {
        const px = Math.min(pixels.w - 1, Math.floor(p[0] * pixels.w));
        const py = Math.min(pixels.h - 1, Math.floor(p[1] * pixels.h));
        const i = (py * pixels.w + px) * 4;
        return luminance(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
      }
      continue;
    }
    const bg = parseOpaqueColor(getComputedStyle(el).backgroundColor);
    if (bg !== null) return bg;
  }
  return null;
}

// 區域內取 3×9 個格點平均（直書標示是又細又長的一條）。整塊都量不到時回傳 null。
export function backdropLuminance(rect: DOMRect, exclude: Element): number | null {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 9; j++) {
      const x = rect.left + ((i + 0.5) / 3) * rect.width;
      const y = rect.top + ((j + 0.5) / 9) * rect.height;
      const l = pointLuminance(x, y, exclude);
      if (l !== null) {
        sum += l;
        count++;
      }
    }
  }
  return count ? sum / count : null;
}
