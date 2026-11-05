"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PartnerCatalog as Catalog } from "@/lib/partners";
import { LOGO_HINT, TEXT_PRIMARY } from "@/components/theme";

// 單位 LOGO 列裡有型錄的單位（2026-11-05）：點 LOGO 跳出視窗，型錄一頁一張圖往下捲，上方有「前往官網」
// 與「關閉」。視窗掛到 body，不受 LOGO 列所在區塊的捲動與層級影響；Esc 或點視窗外也能關閉。
export function PartnerCatalog({
  name,
  url,
  catalog,
  children,
}: {
  name: string;
  url?: string;
  catalog: Catalog;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pages = Array.from({ length: catalog.count }, (_, i) => `${catalog.dir}/p${String(i + 1).padStart(2, "0")}.jpg`);
  const button = `border px-3 py-1.5 font-serif-tc text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-60 sm:px-4 sm:py-2 sm:text-sm ${TEXT_PRIMARY}`;

  return (
    <>
      <button type="button" aria-label={`${name}：${catalog.title}`} onClick={() => setOpen(true)} className="group relative block cursor-pointer transition-opacity hover:opacity-70">
        {children}
        {/* 滑鼠移到 LOGO 上的小提示（手機沒有滑鼠，不顯示） */}
        <span className={LOGO_HINT}>點我看型錄</span>
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 sm:p-6" role="dialog" aria-modal="true" aria-label={catalog.title} onClick={() => setOpen(false)}>
            <div className="flex h-full w-full max-w-4xl flex-col bg-[var(--background)] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--border-subtle)" }}>
                <h2 className={`min-w-0 truncate font-serif-tc text-base font-bold sm:text-lg ${TEXT_PRIMARY}`}>{catalog.title}</h2>
                <div className="flex shrink-0 gap-2">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className={button} style={{ borderColor: "currentColor" }}>
                      前往官網 →
                    </a>
                  )}
                  <button type="button" onClick={() => setOpen(false)} className={button} style={{ borderColor: "var(--border-subtle)" }}>
                    關閉
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-100 p-3 sm:p-6">
                {pages.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt={`${catalog.title} 第 ${i + 1} 頁`} loading="lazy" width={1400} height={1980} className="block h-auto w-full bg-white shadow-sm" />
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
