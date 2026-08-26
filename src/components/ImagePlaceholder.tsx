import Image from "next/image";
import { motion } from "framer-motion";
import type { ProjectImage } from "@/lib/projects";

// 有 image.src 就顯示真實照片，沒有的話用色塊佔位（之後補圖再換掉）。
//
// layoutId 是可選的 shared element transition 掛勾（見展覽規格書「頁面轉場用 shared element
// transition」）——傳了就用 framer-motion 的 motion.div 當外層容器，讓這張照片能跟畫面上
// 別處同一個 layoutId 的實例（通常是首頁 PhotoStream 的縮圖）自動接上放大動畫；沒傳就是
// 普通 div，行為完全不變，大部分呼叫端不需要理會這個。
export function ImagePlaceholder({
  image,
  aspect = "aspect-[4/5]",
  fill = false,
  className = "",
  layoutId,
}: {
  image: ProjectImage;
  aspect?: string;
  fill?: boolean;
  className?: string;
  layoutId?: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      className={`group relative w-full overflow-hidden ${image.src ? "" : image.tone} ${fill ? "h-full" : aspect} ${className}`}
    >
      {image.src ? (
        <Image
          src={image.src}
          alt={image.caption ?? ""}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.02]">
          <span className="font-mono text-[11px] tracking-widest text-black/40 uppercase">
            {image.caption ?? "image"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
