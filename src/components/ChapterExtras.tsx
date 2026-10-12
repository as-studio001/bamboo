"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import { TEXT_BODY, TEXT_PAD } from "@/components/theme";

// 這幾個元件原本寫在 SplitExhibition.tsx 裡，現在首頁雙欄（只用 ChapterMap）跟案例內頁
// （ChapterMap＋ChapterPdf＋ChapterVideo）都要用，抽成共用檔案，邏輯本身沒有變動。

// 左右刻意留白（不滿版），跟滿版貼邊的圖片做出區隔；原生 controls 自帶跨瀏覽器全螢幕按鈕。
export function ChapterVideo({ src }: { src: string }) {
  return (
    <div className="mt-4 px-6 sm:mt-6 sm:px-12 lg:px-16">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video src={src} controls playsInline className="aspect-video w-full bg-black" />
    </div>
  );
}

export function ChapterPdf({ pdf, accent }: { pdf: { url: string; label: string }; accent: string }) {
  return (
    <div className={`mt-4 sm:mt-6 ${TEXT_PAD}`}>
      <a
        href={pdf.url}
        download
        className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wide uppercase underline underline-offset-2 sm:text-xs"
        style={{ color: accent }}
      >
        {pdf.label}
      </a>
    </div>
  );
}

// 座標格式化成「23.0003° N, 120.1962° E」這種可讀的degree文字，照 Internal-Pages
// （as-studio001/Internal-Pages 的 js/render.js formatCoords）同一套呈現方式。
function formatCoords(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

// 基地地圖：嵌入 Google 地圖（衛星圖，t=k），用 maps.google.com 的 output=embed 網址——不需要
// API 金鑰、不用綁帳單，座標直接沿用後台「基地」章節填的經緯度／縮放。
// 地圖上蓋一層透明遮罩：iframe 是跨網域的，滑鼠在上面時滾輪事件會被地圖接走，欄位的自訂慣性捲動
// （SplitExhibition.tsx 的 usePanelWheelScroll）跟整頁捲動都會在地圖上卡住。遮罩擋著時滾輪照常
// 捲動頁面，點一下才拿掉遮罩、開始操作地圖；滑鼠離開地圖就恢復遮罩。
export function ChapterMap({ project }: { project: Project }) {
  const coords = project.coordinates;
  const [active, setActive] = useState(false);

  return (
    <div className={`mt-4 sm:mt-6 ${TEXT_PAD}`}>
      {coords ? (
        <>
          <div className="group relative h-52 w-full overflow-hidden sm:h-72" onMouseLeave={() => setActive(false)}>
            <iframe
              title={`${project.name} 基地位置`}
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&t=k&z=${coords.zoom ?? 15}&hl=zh-TW&output=embed`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {!active && (
              <button
                type="button"
                aria-label="點一下操作地圖"
                onClick={() => setActive(true)}
                className="absolute inset-0 flex cursor-pointer items-end justify-center pb-3"
              >
                <span className="rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] tracking-wide text-white opacity-0 transition-opacity group-hover:opacity-100">
                  點一下操作地圖
                </span>
              </button>
            )}
          </div>
          <div className="mt-3 text-center">
            {coords.address && (
              <p className={`text-[10px] sm:text-[11px] ${TEXT_BODY}`}>{coords.address}</p>
            )}
            <p className={`mt-1 font-mono text-[9px] tabular-nums sm:text-[10px] ${TEXT_BODY}`}>
              {formatCoords(coords.lat, coords.lng)}
            </p>
          </div>
        </>
      ) : (
        <div
          className="flex h-52 w-full items-center justify-center border border-dashed sm:h-72"
          style={{ borderColor: project.accent }}
        >
          <span
            className="font-mono text-[10px] tracking-widest uppercase sm:text-xs"
            style={{ color: project.accent }}
          >
            地圖待補（尚未提供座標）
          </span>
        </div>
      )}
    </div>
  );
}
