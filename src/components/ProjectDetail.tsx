"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  accentOnLight,
  orderedChapters,
  TEAM_UNITS,
  type Chapter,
  type ChapterKey,
  type Project,
} from "@/lib/projects";
import {
  layoutChapter,
  createRatioState,
  visibleImages,
  type RatioState,
} from "@/lib/photoLayout";
import { usePhotosWithRatio } from "@/lib/usePhotosWithRatio";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { ChapterMap, ChapterVideo } from "@/components/ChapterExtras";
import { AssemblyBook } from "@/components/AssemblyBook";
import { chapterTitle } from "@/lib/chapters";
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
  // （2026-10-14）8 個章節照固定順序排（projects.ts 的 CHAPTER_ORDER）：團隊介紹 → 設計概念 → 建築設計
  // → 細部設計 → 結構設計 → 施工細節 → 組裝說明書 → 基地位置。除了組裝說明書（PDF 翻頁書）跟基地位置
  // （地圖）之外都是同一套圖文交錯排版（NarrativeSection）。還沒填內容的章節整個跳過，不會出現只有
  // 標題的空章節；基地位置一律顯示（沒座標時顯示「地圖待補」）。活動區塊只放在首頁，內頁不再顯示。
  const chapters = orderedChapters(project).filter(
    (c) => c.key !== "site" && hasContent(c),
  );
  const insetX =
    variant === "modal" ? "px-8 sm:px-12 lg:px-16" : "px-4 sm:px-8 lg:px-12";
  // 手機版（<640px）內文照片用負邊距抵掉上面 insetX 的左右內距，貼齊面板／邊框兩側，
  // 拿到螢幕能給的最大寬度；文字維持原本的內距。sm 以上不動。
  const photoBleed = variant === "modal" ? "-mx-8 sm:mx-0" : "-mx-4 sm:mx-0";
  // 整個案例頁共用一份橫幅配對輪替狀態，見 photoLayout.ts 的 RatioState 說明。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ratioState = useMemo(() => createRatioState(), [project.slug]);
  const rootRef = useRef<HTMLDivElement>(null);
  useChapterSnap(rootRef, variant);

  return (
    <div
      ref={rootRef}
      className={`flex min-h-full w-full flex-col ${PANEL_BG} ${TEXT_PRIMARY}`}
    >
      {variant === "page" && (
        <ChapterEdgeNav keys={[...chapters.map((c) => c.key), "site"]} />
      )}
      <DetailHero project={project} insetX={insetX} variant={variant} />

      {/* （2026-10-14）電腦版改成「書」的版面：封面 → 目錄 → 每一章一個跨頁（左欄章節號＋標題＋文字、
          右欄圖片，左欄捲動時固定在畫面上），章節之間用大留白分開、不畫分隔線。手機版維持原本的
          上下圖文交錯（見 ChapterFrame 的說明）。 */}
      <div className={`pt-10 pb-24 sm:pt-0 sm:pb-40 ${insetX}`}>
        <div className="min-w-0">
          <TableOfContents
            items={[...chapters.map((c) => c.key), "site" as ChapterKey].map(
              (key, i) => ({ key, number: chapterNumber(i) }),
            )}
          />

          {chapters.map((chapter, i) => {
            const frame = { number: chapterNumber(i), first: i === 0 };
            return chapter.key === "team" ? (
              <TeamSection key={chapter.key} chapter={chapter} {...frame} />
            ) : chapter.key === "video" ? (
              <VideoSection key={chapter.key} chapter={chapter} {...frame} />
            ) : chapter.key === "assembly" ? (
              <AssemblySection
                key={chapter.key}
                project={project}
                chapter={chapter}
                accent={project.accent}
                {...frame}
              />
            ) : (
              <NarrativeSection
                key={chapter.key}
                chapter={chapter}
                {...frame}
                accent={project.accent}
                ratioState={ratioState}
                photoBleed={photoBleed}
              />
            );
          })}

          <ChapterFrame
            sticky={false}
            id="site"
            number={chapterNumber(chapters.length)}
            title={chapterTitle("site")}
            first={chapters.length === 0}
            right={<ChapterMap project={project} />}
          />
        </div>
      </div>
    </div>
  );
}

const HERO_INTERVAL_MS = 5000;

function DetailHero({
  project,
  insetX,
  variant,
}: {
  project: Project;
  insetX: string;
  variant: "page" | "modal";
}) {
  const heroImages = project.coverImages.filter((img) => img.src);
  const finalImage =
    heroImages[heroImages.length - 1] ?? project.coverImages[0];
  const finalHeroSrc = finalImage?.src;

  // 兩案標題一律白字（原本會另外下載封面原圖、分析亮度決定黑字或白字，但結果已經不使用，拿掉這個
  // 額外下載——原圖數百 KB，會拖慢進入案例頁）。之後要依照片換字色，可以再接回 useImageTextColor。
  const heroTitleColor = finalHeroSrc ? "text-white" : TEXT_PRIMARY;

  // （2026-10-15）封面輪播：用後台「封面照片」清單（coverImages，順序照清單），只有一張時維持靜態。
  // 一開始先顯示最後一張——跟首頁兩欄的封面是同一張（同一個 layoutId），從首頁點進來的放大轉場才接得上；
  // 之後每 5 秒換下一張（從第一張開始輪），淡入淡出 1 秒。右下角圓點可以手動切換，滑鼠停在
  // 封面上時暫停；系統設定「減少動態效果」時不自動輪播（手動切換照常）。
  const slides = heroImages.length ? heroImages : finalImage ? [finalImage] : [];
  const [active, setActive] = useState(slides.length - 1);
  const [paused, setPaused] = useState(false);
  const hasCarousel = slides.length > 1;
  useEffect(() => {
    if (!hasCarousel || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % slides.length), HERO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hasCarousel, paused, slides.length, active]);

  return (
    <div
      // （2026-10-15，電腦版）封面滿版：剛好一整個畫面高，往下捲才看得到目錄。
      // - 獨立頁：用負邊距抵掉外框（projects/[slug]/layout.tsx 的 main）左右、上方各 30px 的白邊，貼滿視窗
      // - 彈出視窗：面板本身就是左右貼齊玻璃脫縫的寬度，高度＝面板高度（視窗高 − 上方 106px 的標籤列）
      // 手機版維持原本 70vh。
      className={`relative flex h-[70vh] min-h-[420px] w-full shrink-0 flex-col justify-end ${
        variant === "page"
          ? "sm:-mx-[30px] sm:-mt-[30px] sm:h-[100dvh] sm:w-[calc(100%+60px)]"
          : "sm:h-[calc(100dvh-106px)]"
      }`}
      // 右側「2026常民竹小屋 × 案名」在封面上不顯示，靠這個標記找封面（見 EdgeTitle.tsx 的 useOnProjectCover）
      data-project-cover=""
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((img, i) => (
        <div
          key={img.id}
          aria-hidden={i !== active || undefined}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === active ? "opacity-100" : "opacity-0"}`}
        >
          <ImagePlaceholder image={img} fill layoutId={img.id === finalImage?.id ? finalImage.id : undefined} />
        </div>
      ))}
      {hasCarousel && (
        // 圓點指示（一張一點，目前那張是實心白點、其他是半透明），點圓點直接跳到那張。
        // 放在跟案名相反的那一側（案名靠左就放右下、案名靠右——例如「一籌」——就放左下），不會疊到案名
        <div className={`absolute bottom-0 z-20 flex items-center gap-1 px-3 pb-5 sm:px-7 sm:pb-9 lg:px-11 ${project.titleAlign === "right" ? "left-0" : "right-0"}`}>
          {slides.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`第 ${i + 1} 張，共 ${slides.length} 張`}
              aria-current={i === active || undefined}
              className="group p-1.5"
            >
              <span
                className={`block size-2 rounded-full bg-white shadow-[0_0_4px_rgba(0,0,0,0.45)] transition-opacity duration-300 ${
                  i === active ? "opacity-100" : "opacity-45 group-hover:opacity-80"
                }`}
              />
            </button>
          ))}
        </div>
      )}
      {/* project.titleAlign（見 projects.ts）——跟首頁 SplitExhibition.tsx 的封面標題同一個
          設定，「一籌」在內頁 hero 也維持靠右，兩邊視覺語言一致。 */}
      <div
        className={`relative z-10 pb-8 sm:pb-12 ${insetX} ${project.titleAlign === "right" ? "text-right" : ""}`}
      >
        {/* （2026-10-14）電腦版字體與大小跟首頁封面上的案名（SplitExhibition.tsx 的封面大標）一致：
            大標 48px（lg 57.6px）粗黑、資訊小字 18px 一般字重、跟內文同一套字體（不是等寬字）。手機版維持原樣。 */}
        <h1
          className={`font-black leading-[0.95] tracking-tight uppercase text-4xl sm:text-5xl lg:text-[57.6px] ${heroTitleColor}`}
        >
          {project.name}
        </h1>
        <p
          className="mt-3 font-mono text-[10px] tracking-wide uppercase sm:[font-family:inherit] sm:text-[18px] sm:font-normal"
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
// 同樣寬度），內頁實際有內容的章節直書標籤垂直置中排列（用完整章節名稱），點擊捲到內頁對應區塊。
function ChapterEdgeNav({ keys }: { keys: ChapterKey[] }) {
  function goTo(key: string) {
    scrollBlockToTop(document.getElementById(key));
  }

  // （2026-10-14）封面、目錄的時候還不顯示，第一章的「01」捲到畫面正中間才淡入；捲回去再淡出
  const [visible, setVisible] = useState(false);
  const firstKey = keys[0];
  useEffect(() => {
    // 以第一章開頭的大編號「01」為準（章節框上面還有一段留白，用框的上緣會太早出現）：01 捲到畫面正中間才出現
    const first = document.getElementById(firstKey)?.querySelector("header");
    if (!first) return;
    const update = () => setVisible(first.getBoundingClientRect().top <= window.innerHeight / 2);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [firstKey]);

  return (
    <nav
      aria-hidden={!visible || undefined}
      className={`fixed inset-y-0 left-0 z-40 flex w-[18px] flex-col items-center justify-center gap-5 transition-opacity duration-500 sm:w-[30px] sm:gap-7 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* 每個直書章節名稱上方加章節編號（01、02…，跟目錄、章節開頭的大編號同一套），編號橫排不轉向。
          字體、字級、字距、顏色跟右側邊框的「2026常民竹小屋」（EdgeTitle.tsx）一樣：襯線字 10／12px、
          字距 0.2em、主文字色 */}
      {keys.map((key, i) => (
        <button
          key={key}
          onClick={() => goTo(key)}
          className="flex flex-col items-center gap-1.5 font-serif-tc text-[10px] text-[var(--foreground)] uppercase sm:text-xs"
        >
          <span className="tabular-nums">{chapterNumber(i)}</span>
          <span className="[writing-mode:vertical-rl] tracking-[0.2em]">{chapterTitle(key)}</span>
        </button>
      ))}
    </nav>
  );
}

// 章節淡入淡出（2026-10-15，只有電腦版）：章節（目錄也是）跟畫面中間 60% 的區域有重疊時完全顯示，
// 捲出這個區域就淡出，捲進來再淡入——跨章節時上一章淡出、下一章淡入，切換比較柔和。只動 opacity
// （不用 transform，避免影響左欄的 sticky）；系統設定「減少動態效果」的人不套用。
// data-faded="true" 時透明，由 useFadeInView 依 IntersectionObserver 切換。
const FADE_CLASS =
  "sm:transition-opacity sm:duration-700 sm:ease-out sm:data-[faded=true]:opacity-0 motion-reduce:sm:data-[faded=true]:opacity-100 motion-reduce:transition-none";

function useFadeInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.faded = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.dataset.faded = entry.isIntersecting ? "false" : "true";
      },
      { rootMargin: "-20% 0px -20% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.dataset.faded = "false";
    };
  }, []);
  return ref;
}

// 停下來自動對齊章節（2026-10-15，只有電腦版）：捲動停下約 0.15 秒後，如果畫面上看得到兩個區塊（封面／
// 目錄／章節）的交界，就平滑捲到佔畫面比較多的那一塊——交界在畫面上半部＝下一章佔比較多，把下一章的開頭
// 對齊畫面頂端；交界在下半部＝上一章佔比較多，把上一章的結尾對齊畫面底部（章節至少一整個畫面高，短章節
// 就等於對齊它的開頭）。長章節捲到中間、畫面上沒有交界時不動。
// 捲動中完全不介入（原本試過 CSS scroll-snap，會跟滑鼠滾輪搶捲動、很卡），只在停下來之後才動作。
// 獨立頁捲的是整個視窗；彈出視窗捲的是 DetailModal 的捲動容器。彈出視窗剛打開時會自動捲到被點的那張
// 照片（DetailModal 的開場動畫，約 1 秒），這段時間不對齊，免得把畫面從那張照片拉走。
// 系統設定「減少動態效果」時不套用。
//
// （同日修正，原本「不太順、點左側小標後還會再上下調整一次」）：
// - 停下來的判斷從 0.15 秒拉長到 0.3 秒：滑鼠滾輪一格一格滾時，格與格之間常超過 0.15 秒，會在還在滾的
//   時候就觸發對齊、跟滾輪搶
// - 不用瀏覽器內建的 smooth 捲動，改用自己的緩動動畫（smoothScrollTo，先快後慢）；動畫進行中忽略自己
//   造成的捲動事件，使用者一碰滾輪／觸控／鍵盤就立刻停下動畫，不跟使用者搶
// - 點左側章節小標、目錄項目也用 smoothScrollTo 直接捲到「章節上緣對齊畫面頂端」這個位置——原本用
//   scrollIntoView 會停在上緣往下 40px（scroll-mt-10），接著自動對齊又再補捲 40px，看起來像抖一下
const SNAP_IDLE_MS = 300;
const SCROLL_ANIM_MS = 600;

type ScrollTarget = HTMLElement | Window;
let activeScroll: { cancel: () => void } | null = null;

const getTop = (t: ScrollTarget) => (t instanceof Window ? t.scrollY : t.scrollTop);
const setTop = (t: ScrollTarget, top: number) => (t instanceof Window ? t.scrollTo(0, top) : (t.scrollTop = top));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

function smoothScrollTo(target: ScrollTarget, top: number) {
  activeScroll?.cancel();
  const from = getTop(target);
  const distance = top - from;
  if (Math.abs(distance) < 1) return;
  const start = performance.now();
  let raf = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    activeScroll = null;
    ["wheel", "touchstart", "keydown", "mousedown"].forEach((ev) => window.removeEventListener(ev, stop));
  };
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / SCROLL_ANIM_MS);
    setTop(target, from + distance * easeOutCubic(p));
    if (p < 1) raf = requestAnimationFrame(step);
    else stop();
  };
  ["wheel", "touchstart", "keydown", "mousedown"].forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
  activeScroll = { cancel: stop };
  raf = requestAnimationFrame(step);
}

// 把某個區塊（章節／目錄）的上緣直接跳到畫面頂端——左側章節小標、目錄項目用。
// （同日修正）不用捲動動畫：從 01 跳到 05 時，動畫會一路捲過中間每一章，加上章節的淡入淡出，畫面上會
// 一閃一閃留下殘影。改成直接跳過去，目標章節本身再用淡入（FADE_CLASS）出現，切換一樣柔和、沒有殘影。
function scrollBlockToTop(el: HTMLElement | null) {
  if (!el) return;
  activeScroll?.cancel();
  const scroller = el.closest<HTMLElement>('[role="dialog"] .overflow-y-auto');
  if (scroller) {
    setTop(scroller, scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
  } else {
    setTop(window, window.scrollY + el.getBoundingClientRect().top);
  }
}

function useChapterSnap(rootRef: React.RefObject<HTMLDivElement | null>, variant: "page" | "modal") {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const desktop = window.matchMedia("(min-width: 640px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scroller = variant === "modal" ? root.closest<HTMLElement>(".overflow-y-auto") : null;
    const target: ScrollTarget = scroller ?? window;
    const readyAt = performance.now() + (variant === "modal" ? 1500 : 300);
    let timer: number | undefined;
    // 這一串捲動的方向（1 往下、-1 往上）：對齊只會「順著」使用者剛剛捲的方向繼續走，不會往回拉——
    // 原本「哪一章佔比多就對齊哪一章」的規則，在往下捲、下一章剛露出下半部時會把畫面拉回上一章，
    // 跟使用者的動作反方向，感覺很不順（同日修正）
    let lastTop = getTop(target);
    let direction = 0;

    function snap() {
      if (!desktop.matches || reduced.matches || performance.now() < readyAt || activeScroll || !direction) return;
      const viewTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const viewHeight = scroller ? scroller.clientHeight : window.innerHeight;
      const currentTop = getTop(target);
      const maxTop = scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;

      // 區塊的交界：目錄、每一章的上緣（封面跟目錄之間的交界＝目錄的上緣）
      const blocks = root!.querySelectorAll<HTMLElement>("nav[aria-label='目錄'], section[id]");
      for (const block of blocks) {
        if (block.offsetHeight === 0) continue; // 手機版沒有目錄
        const y = block.getBoundingClientRect().top - viewTop; // 交界在畫面中的位置
        if (y <= 1 || y >= viewHeight - 1) continue; // 交界不在畫面裡
        let delta = 0;
        // 往下捲：交界已經進到畫面下方 1/4 以上，就繼續往下，把下一章開頭對齊畫面頂端；剛從底部露出來不動
        if (direction > 0 && y < viewHeight * 0.75) delta = y;
        // 往上捲：交界已經離開畫面上方 1/4，就繼續往上，把上一章結尾對齊畫面底部；剛從頂端露出來不動
        if (direction < 0 && y > viewHeight * 0.25) delta = -(viewHeight - y);
        const next = Math.max(0, Math.min(maxTop, currentTop + delta));
        if (Math.abs(next - currentTop) >= 2) smoothScrollTo(target, next);
        return;
      }
    }

    // 滑鼠在左欄（章節編號／標題／內文；目錄頁的「目錄」那一側）上滾動＝直接換章（2026-10-15）：
    // 一個滾動手勢（含觸控板放手後的慣性）只換一章，用跟點左側章節小標一樣的「直接跳過去＋淡入」；
    // 往上滾時如果這一章已經捲到中間，先回到這一章開頭，再滾一次才到上一章；目錄頁往上回到封面。
    // 滑鼠在右欄（圖片）照常捲動，捲完這一章的圖片再往下，交給上面的「停下來自動對齊」進到下一章。
    // 左右欄的分界用 grid 第一欄的實際寬度＋一半欄間距算；封面不套用（不在任何區塊裡）。
    const WHEEL_GESTURE_GAP_MS = 200;
    let lastWheel = 0;

    function blocksList() {
      return [...root!.querySelectorAll<HTMLElement>("nav[aria-label='目錄'], section[id]")].filter((b) => b.offsetHeight > 0);
    }

    function inLeftColumn(block: HTMLElement, clientX: number) {
      const s = getComputedStyle(block);
      if (s.display !== "grid") return false;
      const first = parseFloat(s.gridTemplateColumns);
      const gap = parseFloat(s.columnGap) || 0;
      return clientX < block.getBoundingClientRect().left + first + gap / 2;
    }

    function onWheel(e: WheelEvent) {
      if (!desktop.matches || e.deltaY === 0) return;
      const block = (e.target as HTMLElement).closest<HTMLElement>("nav[aria-label='目錄'], section[id]");
      if (!block || !root!.contains(block) || !inLeftColumn(block, e.clientX)) return;
      e.preventDefault();
      const now = performance.now();
      const newGesture = now - lastWheel > WHEEL_GESTURE_GAP_MS;
      lastWheel = now;
      if (!newGesture) return;

      const viewTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const viewHeight = scroller ? scroller.clientHeight : window.innerHeight;
      const blocks = blocksList();
      // 目前這一章＝上緣已經在畫面上半部以上的最後一塊
      let current = -1;
      blocks.forEach((b, i) => {
        if (b.getBoundingClientRect().top - viewTop <= viewHeight / 2) current = i;
      });
      if (e.deltaY > 0) {
        const next = blocks[current + 1];
        if (next) scrollBlockToTop(next);
      } else {
        const cur = blocks[current];
        if (cur && cur.getBoundingClientRect().top - viewTop < -2) scrollBlockToTop(cur);
        else if (current > 0) scrollBlockToTop(blocks[current - 1]);
        else {
          activeScroll?.cancel();
          setTop(target, 0); // 目錄往上＝回到封面
        }
      }
    }
    root.addEventListener("wheel", onWheel, { passive: false });

    const onScroll = () => {
      window.clearTimeout(timer);
      const top = getTop(target);
      if (activeScroll) {
        lastTop = top; // 自己的捲動動畫造成的捲動事件不算
        return;
      }
      if (top !== lastTop) direction = Math.sign(top - lastTop);
      lastTop = top;
      timer = window.setTimeout(snap, SNAP_IDLE_MS);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      root.removeEventListener("wheel", onWheel);
      window.clearTimeout(timer);
    };
  }, [rootRef, variant]);
}

const chapterNumber = (i: number) => String(i + 1).padStart(2, "0");

// 內文字體（2026-10-14）：手機版維持原本的無襯線；電腦版改用跟標題同一套襯線字、行距放寬，讀起來像書
const BODY_TEXT = `text-sm leading-relaxed sm:font-serif-tc sm:text-base sm:leading-[1.95] ${TEXT_BODY}`;

// 書頁式章節框（2026-10-14）。電腦版是兩欄跨頁：左欄（2/5）＝章節號（01、02…）＋章節標題＋文字，捲動
// 這一章時固定在畫面上（sticky）；右欄（3/5）＝這一章的圖片、PDF、影片或地圖。章節之間只用大留白分開。
//
// 手機版要維持原本「標題 → 文字、圖片上下交錯」的樣子：兩個欄位外框在手機上是 display: contents（框本身
// 不存在、裡面的東西直接排進章節的直向 flex），各個區塊用 style.order 指定原本的先後順序（標題 -1、其他
// 從 0 往上），這樣同一份 DOM、同一組 id／layoutId 在兩種尺寸都正確，不用畫兩份內容。
// alignTo：右欄上緣要跟左欄的哪一個東西切齊（右欄往下推的距離＝左欄那個東西上面所有東西的高度）：
//   "text"  第一段內文（預設）：編號 48/60px＋20px＋標題 32px＋內文上距 24px＝124／136px
//   "unit"  團隊介紹的第一個單位小標：編號＋20＋標題 32＋單位上距 40px＝140／152px
//   "title" 章節標題（左欄沒有內文時，例如基地位置）：編號＋20px＝68／80px
// 這幾個數字依賴下面固定的高度：編號 h-12／lg:h-[60px]、標題 leading-8、內文 mt-6、單位 mt-10。
const RIGHT_OFFSET = {
  // ＋8px：對齊內文「字」的上緣，不是段落框的上緣——內文行高 1.95（31.2px）比字大，第一行的字實際在框頂
  // 往下約 8px（行距多出來的 4.1px＋字型本身字身框上方 4px，2026-10-14 用 canvas 量的）
  text: "sm:pt-[132px] lg:pt-[144px]",
  unit: "sm:pt-[140px] lg:pt-[152px]",
  title: "sm:pt-[68px] lg:pt-[80px]",
} as const;

function ChapterFrame({
  id,
  number,
  title,
  first,
  left,
  right,
  alignTo = "text",
  rows,
  sticky = true,
}: {
  id: string;
  number: string;
  title: string;
  first: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  alignTo?: keyof typeof RIGHT_OFFSET;
  rows?: { left: React.ReactNode; right: React.ReactNode }[];
  // sticky：左欄（編號＋標題＋文字）捲動時固定在畫面上（預設）。false＝左右兩欄一起捲動，圖片跟文字不會錯開
  // （團隊介紹的 rows 模式本來就不固定；組裝說明書、影片、基地位置也設成 false）
  sticky?: boolean;
}) {
  const fadeRef = useFadeInView<HTMLElement>();
  const sectionClass = `${FADE_CLASS} flex scroll-mt-10 flex-col ${first ? "" : "border-t pt-10"} sm:grid sm:min-h-screen sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-start sm:gap-x-12 sm:border-0 sm:pt-28 sm:pb-28 lg:gap-x-20`;
  const sectionStyle = first
    ? undefined
    : { borderColor: "var(--border-subtle)" };
  const header = (
    <header style={{ order: -1 }} className="sm:col-start-1">
      <p
        className="hidden font-serif-tc text-5xl leading-none font-light tabular-nums sm:block sm:h-12 lg:h-[60px] lg:text-6xl"
        style={{ color: "var(--foreground-muted)" }}
      >
        {number}
      </p>
      <h3
        className={`font-serif-tc text-lg font-bold tracking-wide uppercase sm:mt-5 sm:text-2xl sm:leading-8 ${TEXT_PRIMARY}`}
      >
        {title}
      </h3>
    </header>
  );

  // rows 模式（團隊介紹用）：每一列左邊文字、右邊圖片，各列自己對齊，左欄不固定在畫面上——圖片跟它旁邊
  // 的文字一起捲動，不會因為捲動而錯開。手機版就是依序「標題 → 第 1 列左、右 → 第 2 列左、右…」。
  if (rows) {
    return (
      <section ref={fadeRef} id={id} className={sectionClass} style={sectionStyle}>
        {header}
        {rows.map((row, i) => (
          <Fragment key={i}>
            <div className="sm:col-start-1">{row.left}</div>
            <div className="sm:col-start-2">{row.right}</div>
          </Fragment>
        ))}
      </section>
    );
  }

  return (
    // （同日修正）電腦版一個畫面只有一個章節：每章至少一整個畫面高（min-h-screen），捲完這一章才會看到下一章。
    // （原本還加了捲動吸附到章節開頭，會跟滑鼠滾輪搶捲動、造成卡頓，已拿掉。）
    // 右欄上緣跟左欄的哪個東西切齊見上面的 RIGHT_OFFSET。
    <section ref={fadeRef} id={id} className={sectionClass} style={sectionStyle}>
      <div className={`contents sm:block sm:self-start ${sticky ? "sm:sticky sm:top-28" : ""}`}>
        {header}
        {left}
      </div>
      <div
        className={`contents sm:flex sm:flex-col sm:gap-6 sm:[&>*]:mt-0 ${RIGHT_OFFSET[left ? alignTo : "title"]}`}
      >
        {right}
      </div>
    </section>
  );
}

// 目錄（只有電腦版）：封面之後、第一章之前，跟章節同一套左右兩欄——左欄「目錄」、右欄章節清單，
// 點一項捲到那一章。
function TableOfContents({
  items,
}: {
  items: { key: ChapterKey; number: string }[];
}) {
  const fadeRef = useFadeInView<HTMLElement>();
  return (
    <nav
      aria-label="目錄"
      ref={fadeRef}
      className={`${FADE_CLASS} hidden sm:grid sm:min-h-screen sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-start sm:gap-x-12 sm:pt-28 sm:pb-28 lg:gap-x-20`}
    >
      {/* （2026-10-15）「目錄」跟右邊清單的章節名稱（例如「團隊介紹」）同一套字體、字級（襯線 18px、行高 28px），
          粗體、灰色；不跟章節開頭的大編號（01、02…）搶。往下推 17px＝清單上框線 1px＋每項上內距 16px，
          跟清單第一項「團隊介紹」同一行 */}
      <div>
        <p
          className="font-serif-tc text-lg leading-7 font-bold sm:pt-[17px]"
          style={{ color: "var(--foreground-muted)" }}
        >
          目錄
        </p>
      </div>
      <ol className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
        {items.map(({ key, number }) => (
          <li
            key={key}
            className="border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              onClick={() =>
                scrollBlockToTop(document.getElementById(key))
              }
              className={`group flex w-full items-baseline gap-6 py-4 text-left font-serif-tc ${TEXT_PRIMARY}`}
            >
              <span
                className="w-8 shrink-0 text-sm tabular-nums"
                style={{ color: "var(--foreground-muted)" }}
              >
                {number}
              </span>
              <span className="text-lg underline-offset-4 group-hover:underline">
                {chapterTitle(key)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// 「團隊介紹」：分成設計單位、業主單位（chapter.units，見 projects.ts 的 TEAM_UNITS），每個單位一個
// 小標，下面左邊是文字、右邊是圖片（多張由上往下排）；手機版文字在上、圖片在下。文字照後台輸入的
// 換行顯示（whitespace-pre-line），空白行也照樣保留，不切成段落、不穿插圖片——這一章是名片式的
// 介紹，不是論述。沒有任何內容的單位不顯示。舊資料還沒有 units、只有 chapter.text／images 的話，
// 就當成一個沒有小標的單位顯示。
// 電腦版（書頁版面）：左欄依序是各單位的小標＋介紹文字，右欄依序是各單位的圖片（正方形、從中間自動裁切、
// 寬度佔右欄一半、向右貼齊）；手機版照原本「單位小標 → 文字 → 圖片」逐個單位排（order：單位 u 的文字 2u、
// 圖片 2u+1）。
function TeamSection({
  chapter,
  number,
  first,
}: {
  chapter: Chapter;
  number: string;
  first: boolean;
}) {
  const units = chapter.units?.length
    ? TEAM_UNITS.map(({ key, title }) => {
        const unit = chapter.units?.find((u) => u.key === key);
        return {
          key,
          title,
          name: unit?.name,
          text: unit?.text,
          images: unit?.images,
        };
      })
    : [
        {
          key: "legacy",
          title: "",
          name: "",
          text: chapter.text,
          images: chapter.images,
        },
      ];
  const shown = units.filter(
    (u) => u.name?.trim() || u.text?.trim() || u.images?.some((img) => img.src),
  );

  return (
    <ChapterFrame
      id={chapter.key}
      number={number}
      title={chapterTitle(chapter.key)}
      first={first}
      // 每個單位一列：左邊小標＋內文、右邊圖片。右邊圖片上緣貼齊單位名稱那一行「字」的上緣：
      // 小標行高 24px、字的上緣在行框內往下 4.5px（canvas 量的），所以右邊往下推 4.5px（沒有小標的單位改對齊內文的字，推 8px），
      // 圖片上緣就跟這個單位的內文第一行切齊；沒有小標的單位就不推。左欄不固定，圖片跟文字一起捲動。
      rows={shown.map((unit) => {
        const hasHeading = !!(unit.title || unit.name?.trim());
        const images = (unit.images ?? []).filter((img) => img.src);
        return {
          left: (
            <div className="mt-8 sm:mt-10">
              {/* 單位小標：「設計單位　初樸建築師事務所」——類別跟單位名稱同一行、中間空一格，跟章節標題同一套
                  字體（襯線粗體、主文字色），字級跟內文一樣；下面只放介紹內文 */}
              {hasHeading && (
                <h4
                  className={`font-serif-tc text-sm font-bold tracking-wide sm:text-base sm:leading-6 ${TEXT_PRIMARY}`}
                >
                  {unit.title}
                  {unit.name?.trim() && (
                    <span className={unit.title ? "ml-[1em]" : ""}>
                      {unit.name.trim()}
                    </span>
                  )}
                </h4>
              )}
              {unit.text?.trim() && (
                <p className={`mt-3 whitespace-pre-line ${BODY_TEXT}`}>
                  {unit.text.trim()}
                </p>
              )}
            </div>
          ),
          right: images.length ? (
            <div
              className={`mt-6 flex flex-col gap-3 sm:mt-10 sm:ml-auto sm:w-[30%] sm:gap-4 ${hasHeading ? "sm:pt-[4.5px]" : "sm:pt-2"}`}
            >
              {images.map((img) => (
                // next/image 自動縮圖、轉 WebP（不直接載原圖，捲動比較順）；電腦版裁成正方形
                <Image
                  key={img.id}
                  src={img.src!}
                  alt={img.caption ?? ""}
                  width={0}
                  height={0}
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="block h-auto w-full sm:aspect-square sm:object-cover"
                />
              ))}
            </div>
          ) : null,
        };
      })}
    />
  );
}

// 「影片」章節（2026-10-14）：chapter.videos 由上往下排，每支有選填的標題（跟內文同字級的襯線粗體小標），
// 下面是播放器（ChapterVideo：YouTube 連結用嵌入播放器，其他網址用原生 <video>）。章節內文（text）有填
// 的話放在最上面。
function VideoSection({
  chapter,
  number,
  first,
}: {
  chapter: Chapter;
  number: string;
  first: boolean;
}) {
  const videos = (chapter.videos ?? []).filter((v) => v.url?.trim());
  return (
    <ChapterFrame
      sticky={false}
      id={chapter.key}
      number={number}
      title={chapterTitle(chapter.key)}
      first={first}
      left={
        chapter.text?.trim() && (
          <p className={`mt-4 whitespace-pre-line sm:mt-6 ${BODY_TEXT}`}>
            {chapter.text.trim()}
          </p>
        )
      }
      right={videos.map((v) => (
        <div key={v.id} className="mt-8">
          {v.title?.trim() && (
            <h4
              className={`font-serif-tc text-sm font-bold tracking-wide sm:text-base ${TEXT_PRIMARY}`}
            >
              {v.title.trim()}
            </h4>
          )}
          <ChapterVideo src={v.url.trim()} inset={false} />
        </div>
      ))}
    />
  );
}

// 章節有沒有內容可以顯示（文字、照片、More in Detail、影片、PDF、團隊介紹的單位，任一樣）
function hasContent(chapter: Chapter) {
  return !!(
    chapter.units?.some(
      (u) => u.name?.trim() || u.text?.trim() || u.images?.length,
    ) ||
    chapter.text?.trim() ||
    chapter.images?.length ||
    chapter.moreImages?.length ||
    chapter.videos?.some((v) => v.url?.trim()) ||
    chapter.pdf?.url
  );
}

// 「建築設計」「模矩」「構造」「施工」四個章節共用同一套圖文編輯模式——直接照抄
// Internal-Pages（as-studio001/Internal-Pages）js/render.js 的 renderContent()／
// makePhotoChunks()，不是重新發明或用隨機數字模擬：一段論述是「段落區塊」跟「圖片區塊」
// 交錯而成的一串序列，圖片區塊要單張大圖、還是兩張不對稱並排、還是多張直幅等寬並排，
// 全部由這組照片「真實的寬高比」決定（見 lib/photoLayout.ts 的 layoutChapter／
// lib/usePhotosWithRatio.ts）——直幅照片自然收成一組、橫幅照片兩張一組但寬窄不對稱、
// 特別寬的全景照獨立佔一整排，「主次關係」是圖片真實形狀本身撐出來的，不是套版型。
// 資料只需要提供 text（純文字）＋images（一組照片），怎麼交錯完全自動算出來；同一組照片、
// 同一段文字，每次算出來的結果都一樣（不會重新整理就跳動），不同章節因為圖片形狀、張數
// 不同，節奏自然不同，「篇章差異、有呼吸感」的來源就是這個，不需要額外加隨機種子。
// 每一章都顯示自己的標題（2026-10-14 起：原本開頭的「建築設計」不顯示標題，章節擴充成 8 個、前面
// 多了「團隊介紹」後改成每章都有標題）；第一章（first）緊接在 hero 之後不加分隔線，其餘每章上方加
// 一條分隔線作為章節之間的視覺斷點，圖文編輯邏輯完全相同。「組裝說明書」不用這套（見下面的
// AssemblySection）——它的主要內容是可翻閱的 PDF，不是穿插圖片的論述文字。
//
// 段落最後接一個「MORE IN DETAIL」可展開區塊（ReadMoreGallery），比照 Internal-Pages 同名
// 區塊——放設計過程的手稿、模型、圖面這類輔助素材，預設收合、不會一開始就佔掉版面，讀者
// 想深入才點開。這批圖是 chapter.moreImages，跟 chapter.images 分開存放，不會混進自動排版
// 或首頁的照片索引。
// 兩張並排一律等寬的章節：建築設計（module）、細部設計（structure）放的是圖說；其他章節維持寬窄輪替
const EQUAL_PAIR_CHAPTERS: ChapterKey[] = ["module", "structure"];

// （2026-10-14 書頁版面）電腦版：段落全部放左欄、圖片依原本的先後放右欄；手機版用 order 還原原本的
// 圖文交錯順序（每個區塊的 order＝它在交錯序列裡的位置，見 ChapterFrame 說明）。
function NarrativeSection({
  chapter,
  number,
  first = false,
  accent,
  ratioState,
  photoBleed,
}: {
  chapter: Chapter;
  number: string;
  first?: boolean;
  accent: string;
  ratioState: RatioState;
  photoBleed: string;
}) {
  const paragraphs = useMemo(
    () => (chapter.text ?? "").split("\n\n"),
    [chapter.text],
  );
  // 這章最多顯示幾張照片，由文字長度決定（見 photoLayout.ts 的 maxPhotosForText）——
  // chapter.images 可以存得比上限多，這裡只取「這篇文字份量撐得起」的前面幾張。
  const shownImages = useMemo(
    () => visibleImages(chapter.text, chapter.images),
    [chapter.text, chapter.images],
  );
  const photosWithRatio = usePhotosWithRatio(shownImages);
  const blocks = useMemo(
    // 「建築設計」「細部設計」放的是設計圖說，兩張並排一律等寬，不做一大一小（見 photoLayout.ts 的 equalPairs）
    () =>
      layoutChapter(paragraphs, photosWithRatio, ratioState, {
        equalPairs: EQUAL_PAIR_CHAPTERS.includes(chapter.key),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paragraphs, photosWithRatio],
  );

  const topGap = "mt-6 sm:mt-8";

  const paragraphNodes = blocks.map((block, i) =>
    block.type === "paragraph" ? (
      <p
        key={i}
        className={`mt-6 max-w-2xl sm:max-w-none ${BODY_TEXT}`}
        style={{ order: i }}
      >
        {block.text}
      </p>
    ) : null,
  );

  const photos = blocks.map((block, i) => {
    if (block.type === "paragraph") return null;

    if (block.type === "photo-solo") {
      const { photo } = block;
      return (
        <div
          key={i}
          id={photo.id}
          data-photo-anchor
          className={`${topGap} ${photoBleed} scroll-mt-4`}
          style={{ order: i }}
        >
          <ImagePlaceholder
            image={photo}
            layoutId={photo.id}
            natural
            aspect="aspect-[16/9]"
          />
        </div>
      );
    }

    // 一組（2 張以上）並排——欄寬（columns，fr 權重）由 layoutChapter 依每張照片的方向
    // 算出來，不是固定對半分；每張照片本身不裁切，寬度照 fr 權重分配、高度由瀏覽器照
    // 該照片真實比例自動算（ImagePlaceholder 的 natural 模式），這就是「形狀決定主次」
    // 具體會畫出來的樣子。
    //
    // row.align（lib/photoLayout.ts 的 applyRowAlignment）——真實照片各自維持真實比例，
    // 高度不一定一樣，矮的那張要「底部切齊」還是「頂部切齊」貼向高的那張，交給排版演算法
    // 決定：單獨一排預設底部切齊；連續兩排以上中間沒有文字隔開時會交替方向，讓兩排矮的
    // 那張都貼向彼此中間的接縫，留白被推到最外側（緊接段落文字的地方），不會卡在兩排
    // 照片正中間顯得莫名其妙——這裡不用另外判斷，照 row.align 給對應的 Tailwind class 就好。
    //
    // 手機版（<640px）不並排——兩張擠在一行每張只剩一百多 px 寬，改成上下各佔一整行
    // （grid-cols-1）。電腦版書頁版面也一樣一次一張（見下方）。
    const { row } = block;
    return (
      <div
        key={i}
        // （2026-10-14）電腦版書頁版面的右欄也是一次一張、上下排列，不再並排（row.columns 不使用）
        className={`${topGap} ${photoBleed} grid grid-cols-1 gap-3 sm:gap-6 ${row.align === "start" ? "items-start" : "items-end"}`}
        style={{ order: i }}
      >
        {row.photos.map((photo) => (
          <div
            key={photo.id}
            id={photo.id}
            data-photo-anchor
            className="scroll-mt-4"
          >
            <ImagePlaceholder
              image={photo}
              layoutId={photo.id}
              natural
              aspect={row.portrait ? "aspect-[3/4]" : "aspect-[4/3]"}
            />
          </div>
        ))}
      </div>
    );
  });

  return (
    <ChapterFrame
      id={chapter.key}
      number={number}
      title={chapterTitle(chapter.key)}
      first={first}
      alignTo={blocks.some((b) => b.type === "paragraph") ? "text" : "title"}
      left={paragraphNodes}
      right={
        <>
          {photos}
          {chapter.moreImages && chapter.moreImages.length > 0 && (
            <div style={{ order: blocks.length }}>
              <ReadMoreGallery
                images={chapter.moreImages}
                accent={accentOnLight(accent)}
              />
            </div>
          )}
        </>
      }
    />
  );
}

// 「+ MORE IN DETAIL」收合圖庫，比照 Internal-Pages 同名區塊——預設收合成一顆帶「+」的
// 文字按鈕，點開才展開成一排小圖＋圖說，一顆按鈕收合／展開，不用另外做進場動畫。
function ReadMoreGallery({
  images,
  accent,
}: {
  images: Chapter["moreImages"];
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  if (!images || images.length === 0) return null;

  return (
    <div
      className="mt-8 border-t pt-6 sm:mt-10 sm:pt-8"
      style={{ borderColor: "var(--border-subtle)" }}
    >
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
        // （已修正）縮圖改小——原本手機 2 欄／桌機 3 欄，圖佔的份量太接近主要內文的照片，
        // 跟「輔助素材、次要瀏覽」的定位不符；改成手機 3 欄／桌機 5 欄，縮圖更小、一次能看到
        // 更多張，份量上更明顯跟上面的主要論述圖片區隔開來。
        // 手機：兩欄縮圖（4:3 裁切）；電腦版（書頁版面，2026-10-14）：跟右欄其他圖片一樣一次一張、上下
        // 排列、原比例不裁切
        <div className="mt-5 flex flex-wrap gap-3 sm:mt-6 sm:flex-col sm:flex-nowrap sm:gap-6">
          {images.map((image) => (
            <div key={image.id} className="w-[calc(50%-6px)] sm:w-full">
              <div className="sm:hidden">
                <ImagePlaceholder image={image} aspect="aspect-[4/3]" />
              </div>
              <div className="hidden sm:block">
                <ImagePlaceholder image={image} natural aspect="aspect-[4/3]" />
              </div>
              {image.caption && (
                <p
                  className={`mt-2 text-[10px] leading-relaxed sm:text-xs ${TEXT_BODY}`}
                >
                  {image.caption}
                </p>
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
function AssemblySection({
  project,
  chapter,
  accent,
  number,
  first = false,
}: {
  project: Project;
  chapter: Chapter;
  accent: string;
  number: string;
  first?: boolean;
}) {
  const [firstParagraph] = (chapter.text ?? "").split("\n\n");

  return (
    <ChapterFrame
      sticky={false}
      id={chapter.key}
      number={number}
      title={chapterTitle(chapter.key)}
      first={first}
      left={
        firstParagraph?.trim() && (
          <p className={`mt-4 max-w-2xl sm:mt-6 sm:max-w-none ${BODY_TEXT}`}>
            {firstParagraph}
          </p>
        )
      }
      right={
        chapter.pdf && (
          <div className="sm:[&>*]:mt-0">
            <AssemblyBook project={project} pdf={chapter.pdf} accent={accent} />
          </div>
        )
      }
    />
  );
}
