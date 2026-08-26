"use client";

import { useState } from "react";
import type { Chapter, Project } from "@/lib/projects";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { ChapterMap, ChapterVideo } from "@/components/ChapterExtras";
import { AssemblyBook } from "@/components/AssemblyBook";
import { useImageTextColor } from "@/lib/useImageTextColor";
import { PANEL_BG, TEXT_PRIMARY, TEXT_BODY } from "@/components/theme";

// 案例內頁：架構直接照抄 Internal-Pages（as-studio001/Internal-Pages 的 js/render.js）的順序——
// hero＋標題 meta → 主要論述段落（「建築設計／模矩／構造／施工」，統一用同一套圖文交錯排
// 版模板，見 NarrativeSection）→「組裝說明書」（標題＋一段文字＋PDF 翻書元件，見
// AssemblySection／AssemblyBook.tsx）→ 底部地圖（「基地」章節）。
// 章節分類標籤放進左側邊框（取代原本「2026林鐵構築」品牌文字的位置，見 ChapterEdgeNav），
// 點擊用原生 scrollIntoView 錨點捲動到對應區塊——這裡是一般文件流，不像首頁雙欄有
// overflow-hidden 的祖先容器，不會有「捲動時外框被一起捲走」的問題，不需要另外寫一套
// rAF 捲動動畫。
//
// variant 預設 "page"（獨立頁面 /projects/[slug] 用，自己畫 ChapterEdgeNav）；彈出視窗版本
// （見 DetailModal.tsx 的攔截路由）會傳 "modal"，唯一差別是不畫自己的 ChapterEdgeNav——那是
// fixed 定位、相對整個視窗，放進 modal 裡會直接貼到螢幕最左邊、跑出面板外面，而且首頁自己的
// TopChapterNav 這時也同時看得到，兩套導覽會同時出現，所以 modal 版本完全交給首頁那份共用的
// 頂部標籤列。（已修正）版面配色維持跟獨立頁面完全一樣的 PANEL_BG，不因為在 modal 裡就換一套
// 配色或做半透明處理。
//
// modal 版本的左右內距比獨立頁面多留一點（見 insetX）——面板外側的玻璃脫縫現在畫了一圈
// 投影（見 DetailModal.tsx），面板邊緣本身沒有這圈投影，但如果文字太貼近面板邊界，視覺上
// 還是會覺得陰影壓到字。獨立頁面沒有這個問題，維持原本內距不變。
//
// 這裡每張照片（hero 封面、NarrativeSection 的 leadImage/secondImage、DetailSubsection 的
// 縮圖）都傳了 layoutId={image.id} 給 ImagePlaceholder——跟首頁 SplitExhibition.tsx 的封面
// hero、PhotoStream.tsx 的縮圖用同一個 id（本來就是同一組 chapter.images／coverImages，
// id 天生對得上）。從首頁點某張照片進到這個 modal 時，framer-motion 會自動接上「那張照片
// 放大長成內文這裡的樣子」的轉場動畫，不用手動算兩邊的座標差。
export function ProjectDetail({
  project,
  variant = "page",
}: {
  project: Project;
  variant?: "page" | "modal";
}) {
  const design = project.chapters.find((c) => c.key === "design");
  const narrativeChapters = project.chapters.filter(
    (c) => c.key === "module" || c.key === "structure" || c.key === "construction",
  );
  const assembly = project.chapters.find((c) => c.key === "assembly");
  const insetX = variant === "modal" ? "px-8 sm:px-12 lg:px-16" : "px-4 sm:px-8 lg:px-12";

  return (
    <div className={`flex min-h-full w-full flex-col ${PANEL_BG} ${TEXT_PRIMARY}`}>
      {variant === "page" && <ChapterEdgeNav chapters={project.chapters} accent={project.accent} />}
      <DetailHero project={project} insetX={insetX} />

      <div className={`pt-10 pb-24 sm:pt-16 ${insetX}`}>
        <div className="min-w-0">
          {design && <NarrativeSection chapter={design} accent={project.accent} />}

          {narrativeChapters.map((chapter) => (
            <NarrativeSection key={chapter.key} chapter={chapter} title={chapter.title} accent={project.accent} />
          ))}

          {assembly && <AssemblySection project={project} chapter={assembly} accent={project.accent} />}

          <div id="site" className="scroll-mt-10 border-t pt-10 sm:pt-14" style={{ borderColor: "var(--border-subtle)" }}>
            <h3 className={`font-serif-tc text-lg font-bold tracking-wide uppercase sm:text-xl ${TEXT_PRIMARY}`}>
              基地
            </h3>
            <div className="mt-4">
              <ChapterMap project={project} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailHero({ project, insetX }: { project: Project; insetX: string }) {
  const heroImages = project.coverImages.filter((img) => img.src);
  const finalImage = heroImages[heroImages.length - 1] ?? project.coverImages[0];
  const finalHeroSrc = finalImage?.src;

  const heroIsDark = useImageTextColor(finalHeroSrc);
  const heroTitleColor = finalHeroSrc ? (heroIsDark === false ? "text-[#141414]" : "text-white") : TEXT_PRIMARY;

  return (
    <div className="relative flex h-[70vh] min-h-[420px] w-full shrink-0 flex-col justify-end sm:h-[80vh]">
      <div className="absolute inset-0">
        <ImagePlaceholder image={finalImage} fill layoutId={finalImage?.id} />
      </div>
      {/* project.titleAlign（見 projects.ts）——跟首頁 SplitExhibition.tsx 的封面標題同一個
          設定，「一籌」在內頁 hero 也維持靠右，兩邊視覺語言一致。 */}
      <div className={`relative z-10 pb-8 sm:pb-12 ${insetX} ${project.titleAlign === "right" ? "text-right" : ""}`}>
        <h1
          className={`font-black leading-[0.95] tracking-tight uppercase text-4xl sm:text-7xl lg:text-8xl ${heroTitleColor}`}
        >
          {project.name}
        </h1>
        <p
          className="mt-3 font-mono text-[10px] tracking-wide uppercase sm:text-xs"
          style={{ color: project.accent }}
        >
          {project.location} · {project.year} · {project.type}
        </p>
      </div>
    </div>
  );
}

// 章節導覽直接取代左側邊框原本的「2026林鐵構築」品牌文字（見 EdgeTitle.tsx 的 side prop、
// projects/[slug]/layout.tsx 只畫右側），定位跟 EdgeTitle 完全對齊（fixed inset-y-0 left-0，
// 同樣寬度），六個章節直書標籤垂直置中排列，點擊捲到內頁對應區塊。
function ChapterEdgeNav({ chapters, accent }: { chapters: Chapter[]; accent: string }) {
  function goTo(key: string) {
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="fixed inset-y-0 left-0 z-40 flex w-[18px] flex-col items-center justify-center gap-6 sm:w-[30px] sm:gap-8">
      {chapters.map((chapter) => (
        <button
          key={chapter.key}
          onClick={() => goTo(chapter.key)}
          className="[writing-mode:vertical-rl] font-mono text-[9px] tracking-[0.15em] uppercase sm:text-[10px]"
          style={{ color: accent }}
        >
          {chapter.title}
        </button>
      ))}
    </nav>
  );
}

// 「建築設計」「模矩」「構造」「施工」四個章節共用同一套圖文排列模板（比照 Internal-Pages
// 的 render.js 主論述排法）：大圖—首段文字—次圖—其餘段落，圖與文交錯呈現，不是文字段落
// 集中寫完才接一排縮圖。「建築設計」是開頭主要論述、緊接在 hero 之後，不重複顯示自己的
// 標題；其餘三章有 title 就加一條分隔線＋小標，作為子章節之間的視覺斷點，圖文排列邏輯完全
// 相同。「組裝說明書」不用這套（見下面的 AssemblySection）——它的主要內容是可翻閱的 PDF，
// 不是穿插圖片的論述文字。
//
// 段落最後接一個「MORE IN DETAIL」可展開區塊（ReadMoreGallery），比照 Internal-Pages
// （as-studio001/Internal-Pages，https://as-studio001.github.io/Internal-Pages/?case=laogu-fang）
// 「+ MORE IN DETAIL」那個收合圖庫——放設計過程的手稿、模型、圖面這類輔助素材，預設收合、
// 不會一開始就佔掉版面，讀者想深入才點開。這批圖是 chapter.moreImages，跟 chapter.images
// （leadImage／secondImage，首頁雙欄也會用到）分開存放，不會混進首頁的照片索引。
function NarrativeSection({ chapter, title, accent }: { chapter: Chapter; title?: string; accent: string }) {
  const [leadImage, secondImage] = chapter.images;
  const [firstParagraph, ...restParagraphs] = chapter.text.split("\n\n");

  return (
    <div
      id={chapter.key}
      className={title ? "scroll-mt-10 border-t pt-10 sm:pt-14" : "scroll-mt-10"}
      style={title ? { borderColor: "var(--border-subtle)" } : undefined}
    >
      {title && (
        <h3 className={`font-serif-tc text-lg font-bold tracking-wide uppercase sm:text-xl ${TEXT_PRIMARY}`}>
          {title}
        </h3>
      )}

      {leadImage && (
        <div
          id={leadImage.id}
          data-photo-anchor
          className={`h-64 scroll-mt-4 sm:h-96 lg:h-[28rem] ${title ? "mt-6 sm:mt-8" : ""}`}
        >
          <ImagePlaceholder image={leadImage} fill layoutId={leadImage.id} />
        </div>
      )}

      <p className={`mt-6 max-w-2xl text-sm leading-relaxed sm:mt-8 sm:text-base ${TEXT_BODY}`}>
        {firstParagraph}
      </p>

      {secondImage && (
        <div id={secondImage.id} data-photo-anchor className="mt-6 h-56 scroll-mt-4 sm:mt-8 sm:h-72">
          <ImagePlaceholder image={secondImage} fill layoutId={secondImage.id} />
        </div>
      )}

      {restParagraphs.map((paragraph, i) => (
        <p key={i} className={`mt-6 max-w-2xl text-sm leading-relaxed sm:mt-8 sm:text-base ${TEXT_BODY}`}>
          {paragraph}
        </p>
      ))}

      {chapter.video && <ChapterVideo src={chapter.video} />}

      {chapter.moreImages && chapter.moreImages.length > 0 && (
        <ReadMoreGallery images={chapter.moreImages} accent={accent} />
      )}
    </div>
  );
}

// 「+ MORE IN DETAIL」收合圖庫，比照 Internal-Pages 同名區塊——預設收合成一顆帶「+」的
// 文字按鈕，點開才展開成一排小圖＋圖說，一顆按鈕收合／展開，不用另外做進場動畫。
function ReadMoreGallery({ images, accent }: { images: Chapter["moreImages"]; accent: string }) {
  const [open, setOpen] = useState(false);
  if (!images || images.length === 0) return null;

  return (
    <div className="mt-8 border-t pt-6 sm:mt-10 sm:pt-8" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-mono text-[10px] tracking-wide uppercase sm:text-xs"
        style={{ color: accent }}
        aria-expanded={open}
      >
        <span className="text-sm leading-none">{open ? "−" : "+"}</span>
        <span>More in Detail</span>
      </button>

      {open && (
        <div className="mt-5 flex flex-wrap gap-3 sm:mt-6 sm:gap-4">
          {images.map((image) => (
            <div key={image.id} className="w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)]">
              <ImagePlaceholder image={image} aspect="aspect-[4/3]" />
              {image.caption && (
                <p className={`mt-2 text-[10px] leading-relaxed sm:text-[11px] ${TEXT_BODY}`}>{image.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 「組裝說明書」只留標題＋一段文字＋PDF 上架元件（AssemblyBook.tsx：封面縮圖＋線上翻閱＋
// 下載），不再用縮圖列——這一章的內容本質是操作手冊，PDF 本身才是主要內容，原本那排縮圖
// 反而是重複資訊。只取 chapter.text 的第一段，不管資料裡實際存了幾段，維持排版簡潔。
function AssemblySection({ project, chapter, accent }: { project: Project; chapter: Chapter; accent: string }) {
  const [firstParagraph] = chapter.text.split("\n\n");

  return (
    <div
      id={chapter.key}
      className="scroll-mt-10 border-t pt-10 sm:pt-14"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <h3 className={`font-serif-tc text-lg font-bold tracking-wide uppercase sm:text-xl ${TEXT_PRIMARY}`}>
        {chapter.title}
      </h3>

      <p className={`mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${TEXT_BODY}`}>{firstParagraph}</p>

      {chapter.pdf && <AssemblyBook project={project} pdf={chapter.pdf} accent={accent} />}
      {chapter.video && <ChapterVideo src={chapter.video} />}
    </div>
  );
}
