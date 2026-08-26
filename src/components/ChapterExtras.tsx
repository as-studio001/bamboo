"use client";

import { useEffect, useRef } from "react";
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

export function ChapterMap({ project }: { project: Project }) {
  const coords = project.coordinates;
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coords || !mapRef.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        attributionControl: true,
      }).setView([coords.lat, coords.lng], coords.zoom ?? 14);

      // 國土測繪中心 PHOTO2：免金鑰的台灣正射影像圖磚，跟 Internal-Pages（as-studio001/Internal-Pages
      // 的 js/render.js renderMap）同一個圖資來源——是台灣官方測繪資料，比全球通用的衛星圖層更貼合
      // 台灣基地的精細度，也不像商用圖磚服務有速率限制的疑慮。
      L.tileLayer("https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "圖資來源：內政部國土測繪中心",
      }).addTo(map);

      // 水滴形圖標＋脈動白環，造型照 Internal-Pages 的 .site-pin，顏色換成這個站的螢光綠點綴色
      // （project.accent）而不是它原本的橘色，維持全站單一點綴色的規則。
      const pinIcon = L.divIcon({
        className: "",
        html: `<div class="site-pin" style="--pin-color:${project.accent}"><div class="site-pin__shadow"></div><div class="site-pin__drop"><div class="site-pin__ring"></div></div></div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 44],
      });
      L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(map);
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [coords, project.accent]);

  return (
    <div className={`mt-4 sm:mt-6 ${TEXT_PAD}`}>
      {coords ? (
        <>
          <div ref={mapRef} className="site-map-canvas h-52 w-full sm:h-72" />
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
