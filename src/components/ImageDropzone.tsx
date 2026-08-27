"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

// 副檔名判斷是不是影片——GET /api/upload 回傳的是純網址字串，沒有連 MIME type 一起帶回來
// （上傳當下的 File 物件才有 file.type，清單重新整理／再次進到這頁時已經拿不到），只能用
// 副檔名猜，涵蓋常見的網頁可播放格式就夠用。GIF 不用特別判斷——瀏覽器原生 <img> 本來就會
// 播放 GIF 動畫，跟一般圖片同一套渲染邏輯，不需要例外處理。
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogg", ".ogv"];
function isVideoUrl(url: string) {
  const lower = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// 拖拉上傳圖片／GIF／影片到本機 public/images/{slug}/ 資料夾（見 src/app/api/upload/route.ts）。
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
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
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
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((url) =>
            isVideoUrl(url) ? (
              // 影片縮圖：靜音、循環、自動播放當動態縮圖，沒有播放控制列——這裡只是預覽格，
              // 不是正式播放介面，跟旁邊的圖片縮圖維持一樣的視覺份量（object-cover 填滿方格）。
              <video
                key={url}
                src={url}
                muted
                loop
                autoPlay
                playsInline
                className="aspect-square w-full rounded object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-square w-full rounded object-cover" />
            ),
          )}
        </div>
      )}
    </div>
  );
}
