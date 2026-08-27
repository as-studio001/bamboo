"use client";

import { useEffect, useState } from "react";
import type { ProjectImage } from "@/lib/projects";
import type { PhotoWithRatio } from "@/lib/photoLayout";

// 照抄 Internal-Pages（as-studio001/Internal-Pages）js/render.js 的 measureRatio()／
// withMeasuredRatios()——排版演算法要用的「圖片形狀」不是猜的，是瀏覽器端量出來的真實
// naturalWidth/naturalHeight。image.ratio 有手動填的話優先用那個（見 projects.ts），
// 沒有 src 的示意色塊一律當 4/3。同一張圖（同 src）量過一次就快取起來，同一頁不同章節、
// 或首頁 PhotoStream 用到同一張圖時不用重複量測。
const ratioCache = new Map<string, number>();

function measureOne(image: ProjectImage): Promise<number> {
  if (image.ratio) return Promise.resolve(image.ratio);
  if (!image.src) return Promise.resolve(4 / 3);
  const cached = ratioCache.get(image.src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 4 / 3;
      ratioCache.set(image.src!, ratio);
      resolve(ratio);
    };
    img.onerror = () => resolve(4 / 3);
    img.src = image.src!;
  });
}

// 回傳值一開始就帶著（可能不精確的）4/3 預設比例，不是 null／loading 狀態——章節通常只有
// 兩三張圖、多半已經在瀏覽器快取裡（PhotoStream 首頁縮圖已經載過同一批圖），量測通常一瞬間
// 就完成，不值得為了避免那零點幾秒的重排而多做一層 loading 骨架屏。
export function usePhotosWithRatio(images: ProjectImage[]): PhotoWithRatio[] {
  const key = images.map((img) => `${img.id}:${img.src ?? ""}`).join("|");
  const [ratios, setRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(images.map((img) => measureOne(img).then((ratio) => [img.id, ratio] as const))).then((entries) => {
      if (cancelled) return;
      setRatios(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return images.map((img) => ({ ...img, ratio: img.ratio ?? ratios[img.id] ?? 4 / 3 }));
}
