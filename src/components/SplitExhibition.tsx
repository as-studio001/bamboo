"use client";

import { useEffect, useState, useRef, type MouseEvent } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PhotoStream } from "@/components/PhotoStream";
import { ChapterMap } from "@/components/ChapterExtras";
import { useImageTextColor } from "@/lib/useImageTextColor";
import { PANEL_BG, TEXT_PRIMARY, TEXT_PAD } from "@/components/theme";

type Focus = "a" | "b" | null;
type Role = "neutral" | "dominant" | "secondary";

// 兩欄中間留一條細細的分隔縫，讓白色（跟著主題切換的 --background）背景透出來，
// 強化兩案的分界感。寬度算進每一欄的 calc()，兩欄+縫隙加總永遠剛好是 100%，
// 不管目前是哪個 role（50/50、80/20 手機主從切換）都不會跑版。
const DIVIDER_WIDTH = 2; // px

const WIDTH: Record<Role, string> = {
  neutral: `calc(50% - ${DIVIDER_WIDTH / 2}px)`,
  dominant: `calc(80% - ${DIVIDER_WIDTH / 2}px)`,
  secondary: `calc(20% - ${DIVIDER_WIDTH / 2}px)`,
};

const WIDTH_MOBILE: Record<Role, string> = {
  neutral: `calc(50% - ${DIVIDER_WIDTH / 2}px)`,
  dominant: `calc(85% - ${DIVIDER_WIDTH / 2}px)`,
  secondary: `calc(15% - ${DIVIDER_WIDTH / 2}px)`,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function SplitExhibition({ projects }: { projects: [Project, Project] }) {
  const [focus, setFocus] = useState<Focus>(null);
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  // 主從切換（80/20、85/15 那套）只在手機上啟用；電腦版固定兩案 50/50 靜態並列，不做寬度動畫。
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isMobile) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    setFocus(x < rect.width / 2 ? "a" : "b");
  }

  function handleMouseLeave() {
    if (!isMobile) return;
    setFocus(null);
  }

  function activate(id: "a" | "b") {
    if (!isMobile) return;
    setFocus(id);
  }

  const [a, b] = projects;
  const roleFor = (id: "a" | "b"): Role => {
    if (!isMobile) return "neutral";
    if (focus === null) return "neutral";
    return focus === id ? "dominant" : "secondary";
  };

  return (
    <div className="flex h-full w-full flex-col">
      <TopChapterNav projects={projects} />
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex w-full min-h-0 flex-1 items-stretch"
      >
        <Panel project={a} role={roleFor("a")} onActivate={() => activate("a")} />
        <div className="shrink-0 bg-[var(--background)]" style={{ width: DIVIDER_WIDTH }} />
        <Panel project={b} role={roleFor("b")} onActivate={() => activate("b")} />
      </div>
    </div>
  );
}

// 自己用 requestAnimationFrame 跑捲動動畫，不用瀏覽器內建的 scrollTo({behavior:'smooth'})——
// 瀏覽器內建的 smooth scroll 每個瀏覽器的更新頻率、緩動曲線都不一樣（且無法調整），滑到後段常常
// 感覺是「硬停」而不是慢慢滑順地停下來。
//
// 緩動曲線改用 easeInOutCubic（起步、收尾都平緩，不是先前 easeOutQuint 那種一開始就衝很快的曲線）：
// 起步太快的話，每一影格移動的距離差很大，只要畫面稍微有一點掉幀（例如照片還在解碼），就會看起來
// 像「一格一格跳」而不是連續滑動。改成起步平緩之後，就算偶爾掉幀，畫面也是漸進地加速／減速，不會
// 出現肉眼可見的跳格感。時長也改成依捲動距離等比例拉長（距離越遠、時間越長），讓每一影格的移動量
// 大致落在同一個範圍內，滑行到終點前那段的觸感更自由、更像慣性滑順下來。
const scrollAnimations = new WeakMap<HTMLElement, number>();

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateScrollTo(scroller: HTMLElement, target: number, duration?: number) {
  const running = scrollAnimations.get(scroller);
  if (running) cancelAnimationFrame(running);

  const start = scroller.scrollTop;
  const distance = target - start;
  const resolvedDuration = duration ?? Math.min(1600, Math.max(500, Math.abs(distance) * 0.55));
  const startTime = performance.now();

  function step(now: number) {
    const t = Math.min(1, (now - startTime) / resolvedDuration);
    scroller.scrollTop = start + distance * easeInOutCubic(t);
    if (t < 1) {
      scrollAnimations.set(scroller, requestAnimationFrame(step));
    } else {
      scrollAnimations.delete(scroller);
    }
  }

  scrollAnimations.set(scroller, requestAnimationFrame(step));
}

// 每張想被吸附對齊的照片外層都加 data-snap 屬性（開場首圖、照片索引裡的每一張、地圖），
// 慣性滾動停下來後，如果剛好離某一張夠近，就補一小段短動畫把它精準對齊到欄位頂端。
// 只在「夠近」的時候才吸附（PROXIMITY_PX），離所有照片都還遠、停在文字段落中間時完全不動，
// 修正距離本身也很短，所以用比章節標籤跳轉更短的固定時長，不會有「暴衝」的大幅位移感。
const SNAP_PROXIMITY_PX = 96;

function snapToNearestPhoto(scroller: HTMLElement) {
  const targets = Array.from(scroller.querySelectorAll<HTMLElement>("[data-snap]"));
  if (targets.length === 0) return;

  const scrollerTop = scroller.getBoundingClientRect().top;
  let closest: HTMLElement | null = null;
  let closestOffset = Infinity;

  for (const t of targets) {
    const offset = t.getBoundingClientRect().top - scrollerTop;
    if (Math.abs(offset) < Math.abs(closestOffset)) {
      closest = t;
      closestOffset = offset;
    }
  }

  if (closest && Math.abs(closestOffset) > 1 && Math.abs(closestOffset) <= SNAP_PROXIMITY_PX) {
    animateScrollTo(scroller, scroller.scrollTop + closestOffset, 260);
  }
}

// 用滑鼠滾輪／觸控板的 wheel 事件自己算物理慣性，取代瀏覽器原生捲動——原生捲動對「一次送一個固定
// deltaY」的滑鼠滾輪來說是逐格瞬間跳過去；先前試過 CSS scroll-behavior:smooth／scroll-snap，
// 前者連續滾動時像一格一格頓，後者則是吸附修正時常常補一大段距離、感覺像「暴衝」。改成完全自己控制：
// 每次 wheel 事件只把 deltaY 疊加成一份「速度」，之後每一影格（用 requestAnimationFrame，幀數跟著
// 螢幕更新率走）用速度推進 scrollTop、速度再依時間指數衰減，直到幾乎停下來才觸發上面的吸附對齊。
// 這樣滑動全程都是連續、密集更新的，不會有離散的跳格，吸附時的位移量也很小、不會暴衝。
// FRICTION 越接近 1，速度衰減得越慢、拖尾拖得越久，就是「輕飄飄、一直漂」的感覺；調低讓它
// 更快收斂，滑完會比較俐落地「停住」而不是慢慢飄到停，手感會更扎實、有重量感。
const WHEEL_FRICTION = 0.82; // 每 1/60 秒的速度衰減比例，數字越小停得越快、越有煞車感
const WHEEL_STOP_THRESHOLD = 0.08; // 速度低於這個值視為已經停止
// 滾輪的 deltaY 沒縮放的話，一格的「總移動距離」是 deltaY / (1 - FRICTION)（等比級數加總）。
// WHEEL_SCALE 直接縮小每次疊加的速度量，兩者搭配讓一格的總移動距離落在合理範圍（deltaY 100 時約 200px），
// 同時因為 FRICTION 調低了，同樣的總距離會在更短時間內滑完、停得更乾脆，不會有拖尾的漂浮感。
const WHEEL_SCALE = 0.36;
const MAX_VELOCITY = 45; // 速度上限，避免快速連續滾動時越疊越快、衝過頭

function usePanelWheelScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let velocity = 0;
    let rafId: number | null = null;
    let lastTime = 0;

    function normalizeDelta(e: WheelEvent) {
      if (e.deltaMode === 1) return e.deltaY * 16; // line 模式概略換算成 px
      if (e.deltaMode === 2) return e.deltaY * el!.clientHeight; // page 模式
      return e.deltaY;
    }

    function loop(now: number) {
      const elapsed = lastTime ? now - lastTime : 1000 / 60;
      lastTime = now;
      // 分頁被瀏覽器節流（切到背景分頁、視窗縮小等）時，rAF 可能隔很久才又觸發一次，這時 elapsed
      // 會突然變得很大；如果直接拿來當倍率乘上速度，會在恢復的那一影格瞬間暴衝一大段距離。這裡把
      // 單次影格能推進的量上限設在 4 個影格份（約 67ms），節流恢復後改成溫和地接著滑，不會補一大段。
      const frames = Math.min(4, elapsed / (1000 / 60));

      const max = el!.scrollHeight - el!.clientHeight;
      const next = el!.scrollTop + velocity * frames;
      if (next <= 0 || next >= max) {
        el!.scrollTop = Math.max(0, Math.min(max, next));
        velocity = 0;
      } else {
        el!.scrollTop = next;
      }

      velocity *= Math.pow(WHEEL_FRICTION, frames);

      if (Math.abs(velocity) > WHEEL_STOP_THRESHOLD) {
        rafId = requestAnimationFrame(loop);
      } else {
        velocity = 0;
        rafId = null;
        lastTime = 0;
        snapToNearestPhoto(el!);
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      velocity += normalizeDelta(e) * WHEEL_SCALE;
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
      if (rafId === null) {
        lastTime = 0;
        rafId = requestAnimationFrame(loop);
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [ref]);
}

// 只捲動目標所在的那個欄位自己的捲動容器（.overflow-y-auto），不用瀏覽器內建的
// scrollIntoView——它預設會把沿路所有「可捲動」的祖先都一起捲（main 雖然設了
// overflow-hidden，但程式仍能捲它），結果連標籤列所在的外層框都被捲走、消失不見。
function scrollChapterIntoView(id: string) {
  const el = document.getElementById(id);
  const scroller = el?.closest(".overflow-y-auto");
  if (!el || !(scroller instanceof HTMLElement)) return;
  const offset = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  animateScrollTo(scroller, scroller.scrollTop + offset - 16);
}

// 頂部標籤列：只出現一次，貼在邊框內、兩欄的共用頂部，橫向排列，跟案例內頁彈出視窗
// （DetailModal）共用同一份，不會分別各畫一份。點一個標籤：
// - 有案例內頁彈出視窗開著的話，改成捲動那個視窗自己的內容段落（ProjectDetail 裡的章節
//   區塊 id 是不帶案名前綴的純 key，例如 id="module"，跟首頁 `${slug}-module` 這種有前綴
//   的錨點不會撞名，用這個特徵就能判斷「現在要捲的是視窗內容，不是首頁」）
// - 沒有視窗開著，維持原本行為：A、B 兩案同步捲到各自「這個章節的照片群組」（PhotoStream
//   用同一個 id={`${slug}-${key}`} 錨點，因為照片本身就直接借用章節的圖片，天生知道自己
//   屬於哪個章節，這裡才能準確定位）
function TopChapterNav({ projects }: { projects: [Project, Project] }) {
  const [a, b] = projects;

  function goTo(key: string) {
    const modalTarget = document.querySelector(`[role="dialog"] #${CSS.escape(key)}`);
    if (modalTarget) {
      scrollChapterIntoView(key);
      return;
    }
    scrollChapterIntoView(`${a.slug}-${key}`);
    scrollChapterIntoView(`${b.slug}-${key}`);
  }

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-center gap-6 sm:h-[76px] sm:gap-10">
      {a.chapters.map((chapter) => (
        <button
          key={chapter.key}
          onClick={() => goTo(chapter.key)}
          className="font-mono text-[10px] tracking-wide uppercase sm:text-xs"
          style={{ color: a.accent }}
        >
          {chapter.title}
        </button>
      ))}
    </div>
  );
}

function Panel({
  project,
  role,
  onActivate,
}: {
  project: Project;
  role: Role;
  onActivate: () => void;
}) {
  const isCompact = role === "secondary";
  const isMobile = useIsMobile();
  const width = (isMobile ? WIDTH_MOBILE : WIDTH)[role];
  const scrollerRef = useRef<HTMLDivElement>(null);
  usePanelWheelScroll(scrollerRef);

  // 開場首圖：拿掉輪播動畫，直接顯示最後一張（原本刷過去的那些張只是動畫過場，不是內容），
  // 只有那張才是持續存在的封面。
  const heroImages = project.coverImages.filter((img) => img.src);
  const finalImage = heroImages[heroImages.length - 1] ?? project.coverImages[0];
  const finalHeroSrc = finalImage?.src;

  // 開場首圖的標題顏色：不加漸層／陰影，改成直接分析封面照片底部（文字疊放處）的平均亮度，
  // 自動決定用白字還是深字，之後換照片也不用手動再調。
  const heroIsDark = useImageTextColor(finalHeroSrc);
  const heroTitleColor = finalHeroSrc ? (heroIsDark === false ? "text-[#141414]" : "text-white") : TEXT_PRIMARY;

  return (
    <div
      style={{ width }}
      onClick={onActivate}
      className="relative flex min-h-0 min-w-0 shrink-0 grow-0 flex-col overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {/* 這個欄位的滾輪捲動由 usePanelWheelScroll 自己接管（見上方），不再依賴瀏覽器原生捲動／
          scroll-behavior／scroll-snap 這些各家實作不一致的機制——全程用 rAF 逐格推進，幀數密集、
          跟手自由，停下來才會吸附對齊最近的照片（data-snap，見下方）。 */}
      <div ref={scrollerRef} className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto ${PANEL_BG}`}>
        {isCompact ? (
          <div className="flex flex-1 flex-col items-center justify-between py-6 sm:py-10">
            <span
              className={`[writing-mode:vertical-rl] font-black tracking-[0.2em] uppercase leading-none text-base sm:text-xl lg:text-2xl ${TEXT_PRIMARY}`}
            >
              {project.shortLabel}
            </span>
            <div className="mt-6 aspect-[3/4] w-full">
              <ImagePlaceholder image={project.coverImages[0]} />
            </div>
          </div>
        ) : (
          <>
            {/* 開場首圖：圖片滿版貼齊欄位邊緣，文字疊在上面（海報式）。
                每一欄自己獨立捲動；捲到底之後繼續捲會自然帶到外層頁面（往下看到頁尾）。
                （已修正）封面本身現在也是連到案例內頁的連結，不是只有下面 PhotoStream 的縮圖
                才能點進去——封面是整個欄位裡最大、最顯眼的圖，使用者直覺會想點它進內頁。
                hover 縮放效果 ImagePlaceholder 自己內建（group-hover），這裡不用再包一層。
                layoutId={finalImage?.id} 讓這張封面跟 ProjectDetail.tsx 的 DetailHero（同一張
                封面照片、同一個 id）接上 shared element 放大轉場，點封面進內頁時是「這張照片
                自己長大」，不是單純蓋一個無關的視窗。 */}
            <Link
              href={`/projects/${project.slug}`}
              data-snap
              className="relative flex min-h-full w-full shrink-0 flex-col justify-end"
            >
              <div className="absolute inset-0">
                <ImagePlaceholder image={finalImage} fill layoutId={finalImage?.id} />
              </div>
              {/* project.titleAlign（見 projects.ts）讓「一籌」的標題／副標靠右對齊，跟「常民竹小屋」
                  靠左對齊左右呼應——兩案各自獨立的視覺語言，不用套同一套排版。 */}
              <div
                className={`relative z-10 pb-6 sm:pb-10 ${TEXT_PAD} ${project.titleAlign === "right" ? "text-right" : ""}`}
              >
                <h2
                  className={`font-black leading-[0.95] tracking-tight uppercase text-3xl sm:text-6xl lg:text-7xl ${heroTitleColor}`}
                >
                  {project.name}
                </h2>
                <p
                  className="mt-2 font-mono text-[10px] tracking-wide uppercase sm:text-xs"
                  style={{ color: project.accent }}
                >
                  {project.location} · {project.year} · {project.type}
                </p>
              </div>
            </Link>

            {/* 首頁雙欄現在只留「圖片＋簡短說明」的照片索引，跟基地地圖。整體論述、六個章節的完整
                文字都移到 /projects/[slug] 案例內頁（見 ProjectDetail.tsx），這裡不重複放。 */}
            <div className="pt-8 pb-24 sm:pt-12">
              <PhotoStream project={project} />
              <div id={`${project.slug}-site`} className="scroll-mt-4 pt-8 sm:pt-12">
                <ChapterMap project={project} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
