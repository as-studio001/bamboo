"use client";

import { useEffect, useState } from "react";
import { renderPdfPages } from "@/lib/pdfPages";

// 只要 PDF 第一頁當封面圖——首頁雙欄的組裝說明書縮圖、內文放大版的封面圖都呼叫這個 hook，
// 底層 renderPdfPages 本身有快取（見 pdfPages.ts），兩邊通常共用同一次渲染結果。
export function usePdfCover(url: string | undefined) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    renderPdfPages(url).then((pages) => {
      if (!cancelled) setSrc(pages[0]?.src ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return src;
}
