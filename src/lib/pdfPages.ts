"use client";

// 把整份 PDF 逐頁畫成圖片——翻書效果（react-pageflip／page-flip）跟開啟前的封面縮圖都是
// 吃圖片，不是即時渲染 PDF 本身，做法照參考站（pineapplehsieh.github.io/anassembly-studio）
// 用 pdf.js 讀頁、canvas 畫出來再轉成圖片網址。
//
// worker 檔案是靜態放在 public/pdfjs/pdf.worker.min.mjs（跟裝進來的 pdfjs-dist 版本一起複製
// 過去的，見專案根目錄那份複製指令），不透過 CDN 讀取——pdf.js 的 API 版本跟 worker 版本對不上
// 會直接噴錯，鎖進 public 資料夾自己管理，不用依賴外部服務可用性或版本剛好對得上。
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export type PdfPage = { src: string; width: number; height: number };

// 組裝說明書封面圖的共用 id——PhotoStream.tsx（首頁縮圖）跟 ProjectDetail.tsx 的
// AssemblySection（內文放大版）都呼叫這個函式算 id，兩邊才會產生同一個字串，
// framer-motion 的 layoutId 轉場、DetailModal.tsx 的錨點捲動才認得出這是「同一張圖」。
export function pdfCoverId(project: { slug: string }) {
  return `${project.slug}-assembly-cover`;
}

const pageCache = new Map<string, Promise<PdfPage[]>>();

// 同一份 PDF 網址快取結果——封面縮圖跟翻書視窗都會呼叫這個函式，使用者點開翻書之前
// 縮圖那次呼叫通常已經把頁面畫好了，翻書視窗打開時可以直接複用，不用重畫一次。
export function renderPdfPages(url: string, scale = 1.4): Promise<PdfPage[]> {
  const cacheKey = `${url}@${scale}`;
  const cached = pageCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const pdfjs = await getPdfjs();
    const doc = await pdfjs.getDocument({ url }).promise;
    const pages: PdfPage[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // pdfjs-dist 6.x 把 canvas 列成主要參數（canvasContext 只是相容用途），實測兩個一起傳
      // 會讓 render() 的 promise 永遠不 resolve（沒有錯誤訊息，就是卡住不動）；只傳 canvas、
      // 不傳 canvasContext 才會正常渲染完成。
      await page.render({ canvas, viewport }).promise;
      pages.push({ src: canvas.toDataURL("image/jpeg", 0.85), width: viewport.width, height: viewport.height });
    }

    return pages;
  })();

  pageCache.set(cacheKey, promise);
  return promise;
}
