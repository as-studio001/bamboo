"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

// 拖拉上傳圖片到本機 public/images/{slug}/ 資料夾（見 src/app/api/upload/route.ts）。
// 這是開發階段的暫時做法，正式部署後要換成 Supabase Storage。
export function ImageDropzone({ slug, label }: { slug: string; label: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadImages() {
    const res = await fetch(`/api/upload?slug=${slug}`);
    if (!res.ok) return;
    const data = await res.json();
    setImages(data.urls ?? []);
  }

  useEffect(() => {
    loadImages();
  }, [slug]);

  // 瀏覽器預設會把拖進視窗的檔案直接打開／導覽過去，只要放的位置沒有精準落在
  // 框內就會被瀏覽器搶走、看起來像沒反應。這裡攔截整個視窗的 dragover/drop，
  // 阻止瀏覽器接手，讓拖曳一定會落在我們自己的處理邏輯上。
  useEffect(() => {
    const prevent = (e: globalThis.DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    setStatus(`上傳中… 0 / ${list.length}`);
    let done = 0;
    for (const file of list) {
      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("file", file);
      await fetch("/api/upload", { method: "POST", body: formData });
      done += 1;
      setStatus(`上傳中… ${done} / ${list.length}`);
    }
    setStatus(`完成，已上傳 ${list.length} 張`);
    await loadImages();
    setTimeout(() => setStatus(null), 2000);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-black/80">{label}</h3>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded border border-dashed px-6 py-10 text-center text-sm transition-colors ${
          isDragging ? "border-black bg-black/5" : "border-black/20 text-black/50"
        }`}
      >
        {status ?? "把圖片拖到這裡，或點擊選擇檔案"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="aspect-square w-full rounded object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
