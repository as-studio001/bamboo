"use client";

import { Children, useRef, useState, type ReactNode } from "react";

// 活動畫面的左右滑動（2026-11-05）：第一頁總覽，往右是各場次。手機直接左右滑；電腦用上方分頁或箭頭
// （滑鼠滾輪仍是上下捲整個網站，不被這裡吃掉）。用瀏覽器原生的橫向捲動＋scroll-snap，不另外算位移。
export function EventsSlider({ labels, children }: { labels: string[]; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const panels = Children.toArray(children);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = trackRef.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const arrowClass =
    "flex h-9 w-9 items-center justify-center rounded-full border text-base transition-opacity hover:opacity-60 disabled:pointer-events-none disabled:opacity-25";
  const borderStyle = { borderColor: "var(--border-subtle)" };

  return (
    <div className="min-w-0">
      <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
        <div className="flex gap-5 sm:gap-7" role="tablist">
          {labels.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => goTo(i)}
              className={`border-b-2 pb-1 font-serif-tc text-sm transition-colors sm:text-base ${active === i ? "font-bold" : ""}`}
              style={{
                borderColor: active === i ? "currentColor" : "transparent",
                color: active === i ? "var(--foreground)" : "var(--foreground-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button type="button" aria-label="上一頁" disabled={active === 0} onClick={() => goTo(active - 1)} className={arrowClass} style={borderStyle}>
            ←
          </button>
          <button
            type="button"
            aria-label="下一頁"
            disabled={active === panels.length - 1}
            onClick={() => goTo(active + 1)}
            className={arrowClass}
            style={borderStyle}
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {panels.map((panel, i) => (
          <div key={i} className="w-full shrink-0 snap-start [scroll-snap-stop:always]">
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
}
