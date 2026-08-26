"use client";

import { useState } from "react";
import { projects as initialProjects } from "@/lib/projects";
import { ImageDropzone } from "@/components/ImageDropzone";

export default function AdminPage() {
  const [items, setItems] = useState(
    initialProjects.map((p) => ({ slug: p.slug, name: p.name, published: p.published }))
  );
  const [primaryColor, setPrimaryColor] = useState("#171412");
  const [accentColor, setAccentColor] = useState("#8a6d3b");
  const [fontStyle, setFontStyle] = useState<"serif" | "sans">("serif");
  const [imageRatio, setImageRatio] = useState(60);
  const [microInteractions, setMicroInteractions] = useState(true);

  function toggle(slug: string) {
    setItems((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, published: !p.published } : p))
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 font-sans">
      <h1 className="text-xl font-medium">後台管理</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/60">
        目前為介面示範（尚未串接 Supabase 與登入驗證）：以下的上下架切換與美術設定變更只存在於這個瀏覽器分頁，重新整理後會還原，不會影響前台。等 Supabase 帳號與資料表建立後，這裡會改成讀寫真實資料並加上登入保護。
      </p>

      <section className="mt-12">
        <h2 className="text-sm font-medium tracking-wide text-black/80 uppercase">
          建築案上下架
        </h2>
        <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center justify-between py-4">
              <span className="text-sm">{item.name}</span>
              <button
                onClick={() => toggle(item.slug)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  item.published
                    ? "bg-black text-white"
                    : "bg-black/10 text-black/50"
                }`}
              >
                {item.published ? "上架中" : "已下架"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-medium tracking-wide text-black/80 uppercase">
          圖片上傳
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-black/50">
          目前是開發用的本機上傳（存進專案的 public/images/ 資料夾），正式部署後要換成雲端儲存。
        </p>
        <div className="mt-4 space-y-8">
          {initialProjects.map((p) => (
            <ImageDropzone key={p.slug} slug={p.slug} label={p.name} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-medium tracking-wide text-black/80 uppercase">
          美術設定面板
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            主色調
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded border border-black/10"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            輔助色
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded border border-black/10"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            字體風格
            <select
              value={fontStyle}
              onChange={(e) => setFontStyle(e.target.value as "serif" | "sans")}
              className="rounded border border-black/10 px-3 py-2"
            >
              <option value="serif">襯線（編輯感）</option>
              <option value="sans">無襯線（現代感）</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            圖文版面比例（圖片佔比 {imageRatio}%）
            <input
              type="range"
              min={30}
              max={80}
              value={imageRatio}
              onChange={(e) => setImageRatio(Number(e.target.value))}
            />
          </label>

          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={microInteractions}
              onChange={(e) => setMicroInteractions(e.target.checked)}
            />
            啟用微互動效果（hover、輕微動效）
          </label>
        </div>
      </section>
    </div>
  );
}
