"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TEMPLATES, detectImageKind, templateRatio, type ImageKind } from "@/lib/photoTemplate";
import { HOME_CHAPTER_KEYS, orderedChapters, type Chapter, type Project, type ProjectImage } from "@/lib/projects";
import { visibleImages } from "@/lib/photoLayout";
import { usePdfCover } from "@/lib/usePdfCover";
import { pdfCoverId } from "@/lib/pdfPages";
import { TEXT_BODY, SHARED_ELEMENT_TRANSITION } from "@/components/theme";

// 首頁雙欄的「圖片＋簡短說明」索引：一張一列、原始比例顯示（直式就直式、橫式就橫式），
// 不套用統一形狀的裁切遮罩，風格參考 herzogdemeuron.com 的 process 頁面。
// 有 src 的圖片直接用原生 <img>（不是 next/image）——要讓瀏覽器照片本身的 intrinsic
// width/height 決定顯示比例，next/image 需要預先知道比例（fill 或固定 width/height），
// 跟「原始比例」這個需求本身衝突。沒有 src 的佔位圖仍用固定比例的灰階色塊（跟 caption
// 文字疊在一起顯示，比照現有 ImagePlaceholder 沒圖時的作法），避免版面在補圖前後跳動。
//
// （已改）照片原本比封面小一號、左右留白；2026-10-12／13 改成撐滿欄寬，電腦版更進一步改成
// 一張佔一整屏、置中完整顯示（見 PhotoItem）。圖說文字置中對齊。
//
// 每張照片整塊（圖＋圖說）都是連到該案例內頁的連結——首頁只留圖片索引，完整內容在內頁，
// 照片本身就是「看下去」的入口；hover 用跟全站一致的輕微縮放（scale 1.02）當互動回饋。
//
// 點下去不是單純蓋一個跟內容無關的視窗，而是「這張照片」本身放大銜接到內文裡同一張照片
// 的段落（展覽規格書「頁面轉場用 shared element transition」）。用 framer-motion 的
// layoutId 做——PhotoStream 這裡跟 ProjectDetail.tsx 的 NarrativeSection／DetailSubsection
// 用同一個 image.id 當 layoutId，兩邊本來就是同一組 chapter.images（見上方說明），id 天生
// 就對得上，不用另外維護一份對照表。首頁縮圖沒有在點擊時卸載（攔截路由讓首頁維持掛載），
// 內頁那張圖是「新掛上去」的——framer-motion 偵測到同一個 layoutId 在畫面上多了一個新實例，
// 就會自動算出兩者的尺寸／位置差異，補一段從縮圖位置長大到內頁位置的動畫，不用手動算座標。
//
// （已修正）錨點是 #${photo.id}，不是 #${chapter.key}——點某一張照片，內頁要捲到「這張照片」
// 精確的位置，不是只捲到整個章節的開頭（章節可能有兩張圖，只捲到章節開頭會落在第一張，
// 點的如果是第二張就對不上）。ProjectDetail.tsx 每張圖自己的容器都掛了同一個 id={image.id}
// （見 NarrativeSection／DetailSubsection），瀏覽器原生的 hash 捲動天生就能精確定位到那張圖。
//
// 照片直接借用 project.chapters 各章節自己的照片（不是獨立的扁平清單）——這樣每張照片
// 天生就知道自己屬於哪個章節，每個章節的照片群組外層都有 id={`${slug}-${key}`} 錨點，
// 頂部的章節標籤（TopChapterNav）才能準確捲到對應的照片群組。
//
// 每張照片連結本身也掛了 id={photo.id}＋data-photo-anchor——跟 ProjectDetail.tsx 內文那張
// 同一張圖用同一個 id（見上方 layoutId 說明）。關閉 modal 時（DetailModal.tsx 的 close()）
// 會反過來找內文裡目前捲到哪張照片、拿它的 id 來查首頁這裡對應的元素，把首頁這個欄位捲過去
// ——不管使用者關閉前在內文裡看的是不是原本點進來那張，回到首頁都會停在同一張圖，不會跳回
// 封面。data-photo-anchor 是給「找內文目前最靠近頂端的是哪張照片」用的查詢標記。
//
// （已修正）prefetch={false}——正式環境（next build/start，Vercel 上也是同一套）預設會在
// 連結進入視窗範圍時預先抓取目標路由，這會讓 framer-motion 的 layoutId 轉場失效：目標路由
// 的內容一被預抓，Next.js 點擊當下直接整批換上已經準備好的內容，不會走「新元素掛載、
// framer-motion 偵測到既有 layoutId、補一段從舊位置到新位置的動畫」這個正常流程，畫面上
// 看起來就是「直接跳過去」，沒有放大轉場——只有這個開發環境的 next dev 沒有這層預抓機制，
// 才會沒發現。關掉預抓，強制每次點擊都真的走一次完整的路由轉換，轉場動畫才會確實觸發。
export function PhotoStream({ project }: { project: Project }) {
  // 「基地」章節不算進照片索引——那個章節在首頁跟內頁都是用地圖代表（見 ChapterMap），
  // 地圖自己的外層已經有 id={`${slug}-site`} 錨點，這裡再放一組同 id 的照片群組會撞成
  // 重複 id，導致標籤點擊時定位到錯的區塊。「組裝說明書」章節本身沒有 images（內容主體是
  // PDF），但只要有掛 chapter.pdf 就照樣算進來——用 PDF 封面當這一組唯一的「照片」。
  //
  // 這裡跟案例內頁（ProjectDetail.tsx 的 NarrativeSection）共用同一個 visibleImages()
  // （見 lib/photoLayout.ts）——首頁索引跟內頁排版看到的是同一批「文字份量撐得起」的照片，
  // 不會出現首頁列了一堆內頁其實沒顯示的照片、點進去卻找不到對應段落的狀況。
  //
  // （2026-10-14）只取首頁會出現的章節（團隊介紹、結構設計只在案例內頁），照固定順序（見 projects.ts）。
  const groups = orderedChapters(project, HOME_CHAPTER_KEYS).filter(
    (chapter) => chapter.key !== "site" && (visibleImages(chapter.text, chapter.images).length > 0 || chapter.pdf),
  );

  return (
    <div className="flex flex-col">
      {groups.map((chapter, groupIndex) => {
        const photos = visibleImages(chapter.text, chapter.images);
        return (
          <div key={chapter.key} id={`${project.slug}-${chapter.key}`} data-chapter={chapter.key} className="scroll-mt-4">
            {photos.length > 0
              ? photos.map((photo, i) => (
                  <PhotoItem
                    key={photo.id}
                    project={project}
                    photo={photo}
                    isFirst={groupIndex === 0 && i === 0}
                  />
                ))
              : chapter.pdf && (
                  <AssemblyCoverItem project={project} chapter={chapter} isFirst={groupIndex === 0} />
                )}
          </div>
        );
      })}
    </div>
  );
}

function PhotoItem({
  project,
  photo,
  isFirst,
}: {
  project: Project;
  photo: ProjectImage;
  isFirst: boolean;
}) {
  // 版型（只有電腦版套用，見 lib/photoTemplate.ts）：照片／圖說 × 橫式／直式。圖片載入前先用
  // 「照片、橫式」，載入後依真實寬高與內容（白底比例）切換；後台有指定 photo.kind 就以後台為準。
  // 每張圖的格子高度固定是一整屏，切換版型不會讓捲動位置跳動。
  const imgRef = useRef<HTMLImageElement>(null);
  const [measured, setMeasured] = useState<{ ratio: number; kind: ImageKind } | null>(null);
  const measure = (img: HTMLImageElement) => {
    if (!img.naturalWidth) return;
    setMeasured({ ratio: img.naturalWidth / img.naturalHeight, kind: detectImageKind(img) });
  };
  useEffect(() => {
    // 圖片在 React 接上 onLoad 之前就載好（快取）時不會觸發 onLoad，這裡補量一次
    if (imgRef.current?.complete) measure(imgRef.current);
  }, [photo.src]);
  const kind: ImageKind = photo.kind ?? measured?.kind ?? "photo";
  const ratio = templateRatio(kind, measured?.ratio ?? photo.ratio ?? 4 / 3);
  const frameVars = { "--tpl-r": ratio, "--cap-h": photo.caption ? "44px" : "0px" } as React.CSSProperties;

  return (
    <Link
      id={photo.id}
      href={`/projects/${project.slug}#${photo.id}`}
      prefetch={false}
      data-snap
      data-photo-anchor
      // 照片不留左右空白、撐滿整欄寬度（手機 2026-10-12、電腦版 2026-10-13 改）。
      // （2026-10-13）電腦版一張一頁：每張照片佔滿欄位一整屏的高度（--slot-h，由 SplitExhibition.tsx
      // 的 Panel 量欄位可見高度寫入），照片之間不再留間距；配合滾輪一次換一頁，畫面上永遠只有一張。
      // 照片放在固定比例的版型框裡（.tpl-frame，globals.css），框在格子裡置中。手機版維持原本的
      // 原比例＋上下間距。
      className={`group block sm:flex sm:h-[var(--slot-h)] sm:flex-col sm:items-center sm:justify-center sm:pt-0 ${isFirst ? "pt-0" : "pt-8"}`}
      style={frameVars}
    >
      {photo.src ? (
        <>
          <motion.div layoutId={photo.id} transition={SHARED_ELEMENT_TRANSITION} className="tpl-frame overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={photo.src}
              alt={photo.caption ?? ""}
              loading="lazy"
              decoding="async"
              onLoad={(e) => measure(e.currentTarget)}
              className={`block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02] sm:h-full ${
                TEMPLATES[kind].fit === "cover" ? "sm:object-cover" : "sm:object-contain"
              }`}
            />
          </motion.div>
          {photo.caption && (
            <p className={`mt-2 text-center text-[11px] sm:mt-0 sm:shrink-0 sm:py-3 sm:text-xs ${TEXT_BODY}`}>{photo.caption}</p>
          )}
        </>
      ) : (
        <motion.div
          layoutId={photo.id}
          transition={SHARED_ELEMENT_TRANSITION}
          className={`tpl-frame flex aspect-[4/3] w-full items-center justify-center overflow-hidden ${photo.tone}`}
        >
          <span className="font-mono text-[11px] tracking-widest text-black/40 uppercase transition-transform duration-700 ease-out group-hover:scale-[1.02]">
            {photo.caption ?? "image"}
          </span>
        </motion.div>
      )}
    </Link>
  );
}

// 「組裝說明書」在雙欄照片索引裡顯示的不是一張靜態照片，是 PDF 第一頁即時渲染出來的封面
// （usePdfCover，見 pdfPages.ts／usePdfCover.ts），跟內文放大版（AssemblySection）共用同一個
// id（pdfCoverId）——點這張封面會直接捲到內文的組裝說明書段落，也會接上同一套 shared element
// 放大轉場，跟其他章節的照片行為一致。
function AssemblyCoverItem({ project, chapter, isFirst }: { project: Project; chapter: Chapter; isFirst: boolean }) {
  const coverSrc = usePdfCover(chapter.pdf?.url);
  const id = pdfCoverId(project);

  return (
    <Link
      id={id}
      href={`/projects/${project.slug}#${id}`}
      prefetch={false}
      data-snap
      data-photo-anchor
      // 電腦版一張一頁，跟 PhotoItem 相同（佔滿 --slot-h、版型框置中）。組裝說明書的 PDF 封面固定套
      // 「圖說直式」版型（5:7，不裁切）。
      className={`group block sm:flex sm:h-[var(--slot-h)] sm:flex-col sm:items-center sm:justify-center sm:pt-0 ${isFirst ? "pt-0" : "pt-8"}`}
      style={{ "--tpl-r": TEMPLATES.drawing.portrait, "--cap-h": chapter.pdf?.label ? "44px" : "0px" } as React.CSSProperties}
    >
      <motion.div
        layoutId={id}
        transition={SHARED_ELEMENT_TRANSITION}
        className="tpl-frame aspect-[3/4] w-full overflow-hidden"
      >
        {coverSrc && (
          // PDF 頁面是完整版面，用 object-cover 會裁掉四周——改 object-contain，圖不裁切、
          // 按長寬比縮放置中（跟 AssemblyBook.tsx 內文放大版同一個處理方式）。
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        )}
      </motion.div>
      {chapter.pdf?.label && (
        <p className={`mt-2 text-center text-[11px] sm:mt-0 sm:shrink-0 sm:py-3 sm:text-xs ${TEXT_BODY}`}>{chapter.pdf.label}</p>
      )}
    </Link>
  );
}
