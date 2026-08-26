"use client";

import { useEffect, useState } from "react";

// 分析照片「底部區域」（標題疊放的地方）的平均亮度，自動決定標題該用白字還是深字。
// 不加漸層／陰影這類裝飾——直接看照片本身夠不夠暗、夠不夠亮。
// 回傳 true = 底部偏暗（該用白字）、false = 偏亮（該用深字）、null = 還沒算出來或沒有照片。
export function useImageTextColor(src: string | undefined): boolean | null {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(null);
    if (!src) return;

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      const w = 40;
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);

      const sampleHeight = Math.max(1, Math.round(h * 0.35));
      const { data } = ctx.getImageData(0, h - sampleHeight, w, sampleHeight);
      let total = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      setIsDark(total / count < 128);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return isDark;
}
