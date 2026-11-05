"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "orientation-hint-dismissed";

// 手機直拿時畫面底部的小提示（2026-11-05）：只建議、不擋內容，直式版一樣能看。轉成橫向自動消失；
// 按 ✕ 關掉後這次瀏覽不再出現（sessionStorage，關掉分頁就重置；無痕模式讀寫失敗時就當作沒關過）。
export function OrientationHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(orientation: portrait) and (max-width: 639px) and (pointer: coarse)");
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (dismissed) return;
    const update = () => setShow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[150] flex items-center gap-3 rounded-lg bg-neutral-900/90 px-4 py-2.5 font-serif-tc text-sm text-white shadow-lg" role="status">
      <p className="min-w-0 flex-1">建議將手機轉為橫向，瀏覽體驗較佳</p>
      <button type="button" aria-label="關閉提示" onClick={dismiss} className="-mr-1 shrink-0 px-1 text-base leading-none">
        ✕
      </button>
    </div>
  );
}
