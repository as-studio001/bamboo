"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { renderPdfPageHiRes, renderPdfPages, type PdfPage } from "@/lib/pdfPages";

// 翻書檢視視窗：整份 PDF 先用 pdf.js 逐頁畫成圖片（見 pdfPages.ts），再交給 react-pageflip
// （包 page-flip 這個 library）做出翻頁動畫——跟參考站
// https://pineapplehsieh.github.io/anassembly-studio/#/books 同一套技術組合（pdf.js＋page-flip），
// 不是自己刻一個假的翻頁效果。
//
// 尺寸：用第一頁的長寬比，在視窗可用空間裡算出最大的書本尺寸（雙頁攤開，寬度是單頁的兩倍），
// react-pageflip 的 size="fixed" 需要明確的 px 寬高，不能像一般 CSS 那樣用百分比自適應。
//
// usePortrait={false}：閱覽模式固定雙頁攤開檢視，不允許在窄螢幕自動切成單頁模式
// （page-flip 預設 usePortrait=true 會這樣做）——這裡故意鎖死，一律雙頁。
const PageFace = forwardRef<HTMLDivElement, { src: string }>(({ src }, ref) => (
  <div ref={ref} className="bg-white">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt="" className="h-full w-full object-contain" draggable={false} />
  </div>
));
PageFace.displayName = "PageFace";

// react-pageflip 的型別沒有精確描述 pageFlip() 回傳的實例方法，這裡用一個窄型別描述
// 實際會用到的幾個方法（turnToPage／flipNext／flipPrev／getCurrentPageIndex／getPageCount），
// 避免整個檔案掉進 any。
type PageFlipInstance = {
  turnToPage: (page: number) => void;
  flipNext: () => void;
  flipPrev: () => void;
  getCurrentPageIndex: () => number;
  getPageCount: () => number;
};

export function PdfFlipbook({
  url,
  label,
  accent,
  onClose,
}: {
  url: string;
  label: string;
  accent: string;
  onClose: () => void;
}) {
  const [pages, setPages] = useState<PdfPage[] | null>(null);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  // （2026-10-27）放大檢視：null＝一般翻書；數字＝放大倍率（相對翻書時的頁面高度）
  const [zoom, setZoom] = useState<number | null>(null);
  const flipRef = useRef<{ pageFlip: () => PageFlipInstance } | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderPdfPages(url)
      .then((p) => {
        if (!cancelled) setPages(p);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // 放大檢視裡的按鍵交給 ZoomView 自己處理（Esc 先退出放大，不是直接關掉整個視窗）
      if (zoom !== null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") flipRef.current?.pageFlip().flipNext();
      if (e.key === "ArrowLeft") flipRef.current?.pageFlip().flipPrev();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, zoom]);

  const firstPage = pages?.[0];
  const [bookSize, setBookSize] = useState({ width: 320, height: 440 });

  useEffect(() => {
    if (!firstPage) return;
    function recompute() {
      const maxWidth = (window.innerWidth * 0.86) / 2; // 雙頁攤開，單頁寬度先抓可用寬度的一半
      const maxHeight = window.innerHeight * 0.72;
      const ratio = firstPage!.width / firstPage!.height;
      let height = maxHeight;
      let width = height * ratio;
      if (width > maxWidth) {
        width = maxWidth;
        height = width / ratio;
      }
      setBookSize({ width: Math.round(width), height: Math.round(height) });
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [firstPage]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative z-10 flex max-h-full w-full max-w-full flex-col items-center px-4 py-6">
        <div className="mb-4 flex w-full max-w-3xl items-center justify-between gap-4 px-2">
          <p className="truncate font-mono text-[10px] tracking-wide text-white/80 uppercase sm:text-xs">{label}</p>
          <div className="flex shrink-0 items-center gap-4">
            {pages && pages.length > 0 && (
              <button
                onClick={() => setZoom(2)}
                className="font-mono text-[10px] tracking-wide text-white uppercase underline underline-offset-2 hover:opacity-70 sm:text-xs"
              >
                放大檢視
              </button>
            )}
            <a
              href={url}
              download
              className="font-mono text-[10px] tracking-wide text-white uppercase underline underline-offset-2 hover:opacity-70 sm:text-xs"
            >
              下載 PDF
            </a>
            <button
              onClick={onClose}
              aria-label="關閉"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg leading-none text-white transition-opacity hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>

        {error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/80">
            <p className="font-mono text-xs uppercase">PDF 暫時無法預覽</p>
            <a href={url} download className="text-xs underline underline-offset-2">
              直接下載檔案
            </a>
          </div>
        )}

        {!error && !pages && (
          <div className="flex flex-1 items-center justify-center text-white/70">
            <p className="font-mono text-xs uppercase tracking-widest">載入中…</p>
          </div>
        )}

        {!error && pages && pages.length > 0 && (
          <>
            <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
              <button
                onClick={() => flipRef.current?.pageFlip().flipPrev()}
                aria-label="上一頁"
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-opacity hover:opacity-70 sm:flex"
              >
                ‹
              </button>

              <HTMLFlipBook
                ref={flipRef}
                width={bookSize.width}
                height={bookSize.height}
                size="fixed"
                minWidth={200}
                maxWidth={2000}
                minHeight={280}
                maxHeight={2800}
                showCover
                drawShadow
                flippingTime={700}
                maxShadowOpacity={0.4}
                usePortrait={false}
                startPage={0}
                startZIndex={0}
                autoSize={false}
                mobileScrollSupport={false}
                clickEventForward
                useMouseEvents
                swipeDistance={30}
                showPageCorners
                disableFlipByClick={false}
                className=""
                style={{}}
                onFlip={(e: { data: number }) => setCurrent(e.data)}
              >
                {pages.map((p, i) => (
                  <PageFace key={i} src={p.src} />
                ))}
              </HTMLFlipBook>

              <button
                onClick={() => flipRef.current?.pageFlip().flipNext()}
                aria-label="下一頁"
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-opacity hover:opacity-70 sm:flex"
              >
                ›
              </button>
            </div>

            <div className="mt-4 flex w-full max-w-md items-center gap-3 px-2">
              <span className="font-mono text-[10px] text-white/70 tabular-nums">{current + 1}</span>
              <input
                type="range"
                aria-label="跳到指定頁面"
                min={0}
                max={pages.length - 1}
                value={current}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setCurrent(next);
                  flipRef.current?.pageFlip().turnToPage(next);
                }}
                className="h-1 flex-1 accent-current"
                style={{ color: accent }}
              />
              <span className="font-mono text-[10px] text-white/70 tabular-nums">{pages.length}</span>
            </div>
          </>
        )}
      </div>

      {zoom !== null && pages && (
        <ZoomView
          url={url}
          pages={pages}
          baseHeight={bookSize.height}
          current={current}
          zoom={zoom}
          setZoom={setZoom}
          onNavigate={(i) => {
            setCurrent(i);
            flipRef.current?.pageFlip().turnToPage(i);
          }}
        />
      )}
    </div>
  );
}

// 翻書是 showCover 模式：第 1 頁（封面）單獨一頁，之後兩頁一組攤開（2–3、4–5…）。
// 回傳某一頁所在的那一組頁碼（從 0 起算）。
function spreadOf(index: number, count: number) {
  if (index <= 0) return [0];
  const left = index % 2 === 1 ? index : index - 1;
  return left + 1 < count ? [left, left + 1] : [left];
}

const ZOOM_STEPS = [1.5, 2, 3, 4];

// 放大檢視：把目前攤開的那一組頁面放大顯示，可以拖曳／捲動移動畫面，＋／－ 切換倍率，
// ‹ › 換到上一組／下一組（背後的翻書也會同步翻到同一頁，退出放大時停在原處）。
// 頁面先顯示翻書用的圖，高解析度版畫好後再換上去。
function ZoomView({
  url,
  pages,
  baseHeight,
  current,
  zoom,
  setZoom,
  onNavigate,
}: {
  url: string;
  pages: PdfPage[];
  baseHeight: number;
  current: number;
  zoom: number;
  setZoom: (z: number | null) => void;
  onNavigate: (index: number) => void;
}) {
  const spread = spreadOf(current, pages.length);
  const spreadKey = spread.join(",");
  const [hiRes, setHiRes] = useState<Record<number, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    for (const i of spread) {
      if (hiRes[i]) continue;
      renderPdfPageHiRes(url, i).then((src) => {
        if (!cancelled) setHiRes((h) => ({ ...h, [i]: src }));
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, spreadKey]);

  const stepIndex = ZOOM_STEPS.indexOf(zoom);
  const zoomIn = () => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, stepIndex + 1)]);
  const zoomOut = () => setZoom(ZOOM_STEPS[Math.max(0, stepIndex - 1)]);
  const prev = () => spread[0] > 0 && onNavigate(Math.max(0, spread[0] - 2));
  const next = () => {
    const after = spread[spread.length - 1] + 1;
    if (after < pages.length) onNavigate(after);
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  // 換頁或改倍率時，畫面回到上方置中
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [zoom, spreadKey]);

  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-full bg-white/10 px-3 text-sm text-white transition-opacity hover:opacity-70 disabled:opacity-30";
  const pageLabel = spread.map((i) => i + 1).join("–");

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black/95">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="font-mono text-[10px] tracking-wide text-white/80 sm:text-xs">
          第 {pageLabel} 頁 ／ 共 {pages.length} 頁
        </p>
        <div className="flex items-center gap-2">
          <button onClick={prev} disabled={spread[0] === 0} aria-label="上一頁" className={btn}>
            ‹
          </button>
          <button onClick={next} disabled={spread[spread.length - 1] >= pages.length - 1} aria-label="下一頁" className={btn}>
            ›
          </button>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <button onClick={zoomOut} disabled={stepIndex <= 0} aria-label="縮小" className={btn}>
            －
          </button>
          <span className="w-10 text-center font-mono text-[11px] text-white/80 tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={stepIndex >= ZOOM_STEPS.length - 1} aria-label="放大" className={btn}>
            ＋
          </button>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <button onClick={() => setZoom(null)} className={`${btn} font-mono text-[11px]`}>
            返回翻頁
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 cursor-grab overflow-auto active:cursor-grabbing"
        onPointerDown={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const el = scrollRef.current;
          if (!el || !drag.current) return;
          el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
          el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="mx-auto flex w-max p-6">
          {spread.map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={hiRes[i] ?? pages[i].src}
              alt={`第 ${i + 1} 頁`}
              draggable={false}
              className="block bg-white select-none"
              style={{ height: Math.round(baseHeight * zoom), width: "auto" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
