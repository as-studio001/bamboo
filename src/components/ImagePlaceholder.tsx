import Image from "next/image";
import { motion } from "framer-motion";
import type { ProjectImage } from "@/lib/projects";
import { SHARED_ELEMENT_TRANSITION } from "@/components/theme";

// 有 image.src 就顯示真實照片，沒有的話用色塊佔位（之後補圖再換掉）。
//
// layoutId 是可選的 shared element transition 掛勾（見展覽規格書「頁面轉場用 shared element
// transition」）——傳了就用 framer-motion 的 motion.div 當外層容器，讓這張照片能跟畫面上
// 別處同一個 layoutId 的實例（通常是首頁 PhotoStream 的縮圖）自動接上放大動畫；沒傳就是
// 普通 div，行為完全不變，大部分呼叫端不需要理會這個。
//
// natural——比照 PhotoStream.tsx 的原生 <img> 做法：不裁切，讓瀏覽器照片本身的 intrinsic
// width/height 決定顯示比例（NarrativeSection 用這個模式，見 lib/photoLayout.ts；「主次
// 關係」要看得出真實照片的實際形狀，不能套統一裁切框）。這個模式下用原生 <img>（不是
// next/image 的 fill）——fill 需要外層容器先有固定高度，跟「讓照片自己決定高度」互相衝突；
// 沒有 src（示意色塊）時 natural 沒有意義，照舊退回 fill／aspect 那套裁切版面。
export function ImagePlaceholder({
  image,
  aspect = "aspect-[4/5]",
  fill = false,
  natural = false,
  className = "",
  layoutId,
  sizes,
}: {
  image: ProjectImage | undefined;
  aspect?: string;
  fill?: boolean;
  natural?: boolean;
  className?: string;
  layoutId?: string;
  // （2026-10-28）圖片實際顯示的寬度，給 next/image 挑解析度用。預設是半個畫面寬（首頁兩欄）；
  // 滿版的案例封面要傳 "100vw"，不然瀏覽器只會拿到半寬的圖、放大鋪滿後看起來很糊。
  sizes?: string;
}) {
  if (!image) {
    console.error("ImagePlaceholder received undefined image");
    return null;
  }
  if (natural && image.src) {
    return (
      <motion.div
        layoutId={layoutId}
        transition={SHARED_ELEMENT_TRANSITION}
        className={`group relative w-full overflow-hidden ${className}`}
      >
        {/* （2026-10-14）改用 next/image 的「原比例」寫法（width/height 給 0、CSS 寬 100%／高 auto）：
            比例照樣由照片本身決定，但會依螢幕寬度自動縮成合適尺寸、轉成 WebP 再送出，不再直接載入
            1～4MB 的原始截圖／渲染圖——原圖太大，捲動時解碼會造成卡頓。原始檔案不受影響。 */}
        {/* 已經知道比例（image.ratio，案例內頁的圖片會先量好）就用真實比例當寬高：圖片還沒載入前瀏覽器
            就先保留正確的高度，載入時版面不會往下跳（原本高度 0，每載入一張整頁就跳一次，捲動感覺卡） */}
        <Image
          src={image.src}
          alt={image.caption ?? ""}
          width={image.ratio ? 1600 : 0}
          height={image.ratio ? Math.round(1600 / image.ratio) : 0}
          sizes="(max-width: 640px) 100vw, 60vw"
          className="block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={layoutId}
      transition={SHARED_ELEMENT_TRANSITION}
      className={`group relative w-full overflow-hidden ${image.src ? "" : image.tone} ${fill ? "h-full" : aspect} ${className}`}
    >
      {image.src ? (
        <Image
          src={image.src}
          alt={image.caption ?? ""}
          fill
          sizes={sizes ?? "(max-width: 640px) 100vw, 50vw"}
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
