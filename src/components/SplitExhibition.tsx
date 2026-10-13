"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PhotoStream } from "@/components/PhotoStream";
import { ChapterMap } from "@/components/ChapterExtras";
import { AdminAccessLink } from "@/components/AdminAccessLink";
import { EVENTS_KEY } from "@/lib/events";
import { chapterLabel, navColor } from "@/lib/chapters";
import { isPastCover } from "@/lib/coverReveal";
import { PANEL_BG, TEXT_PRIMARY } from "@/components/theme";

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
  // 主從切換（85/15）只在手機上啟用；電腦版固定兩案 50/50 靜態並列，不做寬度動畫。
  // （2026-10-12 修正）手機上預設就是作品一放大、作品二收成右側窄條——原本預設 50/50 時每欄
  // 只有半個螢幕寬，封面大圖被裁成很細長的直條。切換只認「點了哪一欄」（見 Panel 的 onClick），
  // 拿掉原本依手指點在畫面左半／右半判斷的 mousemove 邏輯：85/15 時作品一的欄位會跨過畫面中線，
  // 用左右半邊判斷會把「點作品一右側」誤判成要切到作品二。
  const [focus, setFocus] = useState<Exclude<Focus, null>>("a");
  const isMobile = useIsMobile();

  function activate(id: "a" | "b") {
    if (!isMobile) return;
    setFocus(id);
  }

  const [a, b] = projects;
  const roleFor = (id: "a" | "b"): Role => {
    if (!isMobile) return "neutral";
    return focus === id ? "dominant" : "secondary";
  };

  return (
    <div className="flex h-full w-full flex-col">
      <AdminAccessLink />
      <TopChapterNav projects={projects} />
      <div className="flex w-full min-h-0 flex-1 items-stretch">
        <Panel project={a} side="left" role={roleFor("a")} onActivate={() => activate("a")} />
        <div className="shrink-0 bg-[var(--background)]" style={{ width: DIVIDER_WIDTH }} />
        <Panel project={b} side="right" role={roleFor("b")} onActivate={() => activate("b")} />
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
// 兩次 wheel 事件間隔超過這個時間，才算「停下來之後重新開始的一次滾動」——欄位靠慣性滑到頂／底時，
// 同一串滾動（尤其觸控板的慣性事件）不會順勢衝到上一屏／下一屏，要停一下再滾才會交給整頁捲動。
const WHEEL_GESTURE_GAP_MS = 200;

// 欄位已經在最頂還往上滾、或在最底還往下滾時，不攔截這次滾輪，讓它照瀏覽器原生行為往上傳給整頁
// 捲動容器（(site)/layout.tsx 的 main，scroll-snap），切到「策展宣言」或「活動」那一屏——
// 這樣滑鼠停在欄位上任何位置都能捲到首頁最上方跟最下方，不用先移到空白處。
function usePanelWheelScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let velocity = 0;
    let rafId: number | null = null;
    let lastTime = 0;
    let lastWheelTime = 0;
    let handingOff = false; // 這一串滾動已經交給整頁捲動，連續事件就繼續交出去，不中途又被欄位攔下

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
      const now = performance.now();
      const isNewGesture = now - lastWheelTime > WHEEL_GESTURE_GAP_MS;
      lastWheelTime = now;

      const delta = normalizeDelta(e);
      const max = el!.scrollHeight - el!.clientHeight;
      const pushingPastEdge = (delta < 0 && el!.scrollTop <= 0) || (delta > 0 && el!.scrollTop >= max - 1);
      if (pushingPastEdge && rafId === null && (handingOff || isNewGesture)) {
        handingOff = true;
        return;
      }
      handingOff = false;

      e.preventDefault();
      velocity += delta * WHEEL_SCALE;
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

  // 「活動」不是章節，是整個展覽共用的一份（見 lib/events.ts）：視窗開著時捲到視窗內容最尾端
  // 的活動區塊（id="events"），沒開視窗時整頁捲到首頁最尾端的活動畫面（id="events-screen"）。
  function goToEvents() {
    if (document.querySelector(`[role="dialog"] #${EVENTS_KEY}`)) {
      scrollChapterIntoView(EVENTS_KEY);
      return;
    }
    document.getElementById("events-screen")?.scrollIntoView({ behavior: "smooth" });
  }

  // 名稱跟文字顏色都由後台「章節標題」設定（content/chapters.json，見 lib/chapters.ts）；
  // 沒設定顏色就沿用頁面文字色。
  const navStyle = navColor ? { color: navColor } : undefined;
  // 手機上字只有 10px，按鈕本身只有約 20×15px，手指很難點中——用 ::before 往四周擴大可點範圍
  // （左右各半個間距，剛好跟隔壁接上；上下各 16px，接近整條選單列高度），畫面上的字大小不變。
  // （2026-10-12 修正）寬度 400px 以下的手機（例如 Pixel）原本間距 gap-6 時整排放不下，最右邊的
  // 「活動」會被擠到右側邊框的直書標示（EdgeTitle，也是連結、疊在上層）底下，點「活動」右半邊
  // 其實點到的是 EdgeTitle、被帶回策展宣言。400px 以下間距縮成 gap-4，可點範圍也跟著縮成左右各 8px。
  const labelClass =
    "relative font-black text-[10px] tracking-wide uppercase text-foreground before:absolute before:-inset-x-2 before:-inset-y-4 before:content-[''] min-[400px]:before:-inset-x-3 sm:text-sm";

  return (
    <div className="flex h-[52px] shrink-0 items-center justify-center gap-4 min-[400px]:gap-6 sm:h-[76px] sm:gap-10">
      {a.chapters.map((chapter) => (
        <button key={chapter.key} onClick={() => goTo(chapter.key)} className={labelClass} style={navStyle}>
          {chapterLabel(chapter.key)}
        </button>
      ))}
      <button onClick={goToEvents} className={labelClass} style={navStyle}>
        {chapterLabel("events")}
      </button>
    </div>
  );
}

function Panel({
  project,
  side,
  role,
  onActivate,
}: {
  project: Project;
  side: "left" | "right";
  role: Role;
  onActivate: () => void;
}) {
  const isCompact = role === "secondary";
  const isMobile = useIsMobile();
  // 手機 85/15 時，放大的那一案在欄位頂端常駐一條案名標頭（2026-10-12 新增）。原本窄條的名稱
  // 在頂端、自己的小封面在底端，名稱反而緊貼隔壁的大圖，容易被誤認成那張圖的案名。標頭放在
  // 捲動容器外面（不是 sticky 在裡面），不會蓋到照片，章節跳轉的捲動位置也不用另外補償。
  const showHeader = isMobile && role === "dominant";
  const width = (isMobile ? WIDTH_MOBILE : WIDTH)[role];
  const scrollerRef = useRef<HTMLDivElement>(null);
  usePanelWheelScroll(scrollerRef);

  // 開場首圖：拿掉輪播動畫，直接顯示最後一張（原本刷過去的那些張只是動畫過場，不是內容），
  // 只有那張才是持續存在的封面。
  const heroImages = project.coverImages.filter((img) => img.src);
  const finalImage = heroImages[heroImages.length - 1] ?? project.coverImages[0];

  // 電腦版封面遮罩：欄位還停在封面時顯示，往下捲超過門檻就淡出（見 lib/coverReveal.ts）。
  const [pastCover, setPastCover] = useState(false);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => setPastCover(isPastCover(el));
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      style={{ width }}
      onClick={onActivate}
      // isolate：欄位自成一個疊層範圍，裡面的案名標頭（z-20）只在欄位內比高低。不加的話標頭會
      // 跟全頁比，高過案例彈出視窗後面那層蓋住首頁的白色遮罩（DetailModal.tsx，z-0），開案例時
      // 標頭會從視窗上緣露出來殘留在畫面上。
      className="relative isolate flex min-h-0 min-w-0 shrink-0 grow-0 flex-col overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {/* 這個欄位的滾輪捲動由 usePanelWheelScroll 自己接管（見上方），不再依賴瀏覽器原生捲動／
          scroll-behavior／scroll-snap 這些各家實作不一致的機制——全程用 rAF 逐格推進，幀數密集、
          跟手自由，停下來才會吸附對齊最近的照片（data-snap，見下方）。 */}
      {/* （2026-10-12 再修正）案名標頭改成疊在圖片上、貼齊圖片上緣：大字案名＋下方小字地點／年份／
          類型。疊在捲動容器上面（absolute，不佔版面、pointer-events-none 不擋點擊），往下捲照片時
          一直留在欄位頂端。原本用灰白字，往下捲到白底圖面時看不清楚，改成黑字。 */}
      {showHeader && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-3 ${project.titleAlign === "right" ? "text-right" : ""}`}
        >
          <h2 className="truncate text-3xl leading-[0.95] font-black tracking-tight text-[#141414] uppercase">{project.name}</h2>
          <p className="mt-2 truncate font-mono text-[10px] tracking-wide text-[#141414] uppercase">
            {project.location} · {project.year} · {project.type}
          </p>
        </div>
      )}
      <div ref={scrollerRef} className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto ${PANEL_BG}`}>
        {isCompact ? (
          // 窄條：小封面跟直書案名綁成一組、一起靠在頂端，小封面上緣跟隔壁大圖的上緣切齊，
          // 跟隔壁大圖的關係才不會被誤讀。
          <div className="flex flex-1 flex-col items-center">
            <div className="aspect-[3/4] w-full">
              <ImagePlaceholder image={finalImage ?? project.coverImages[0]} />
            </div>
            <span
              className={`mt-3 [writing-mode:vertical-rl] font-black tracking-[0.15em] uppercase leading-none text-sm ${TEXT_PRIMARY}`}
            >
              {project.name}
            </span>
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
                自己長大」，不是單純蓋一個無關的視窗。prefetch={false}——正式環境預抓連結會讓
                framer-motion 的 layoutId 轉場失效（詳見 PhotoStream.tsx 同樣的修正說明），
                關掉才能確保每次點擊都真的觸發轉場動畫。 */}
            <Link
              href={`/projects/${project.slug}`}
              prefetch={false}
              data-snap
              className="relative flex min-h-full w-full shrink-0 flex-col justify-end"
            >
              <div className="absolute inset-0">
                <ImagePlaceholder image={finalImage} fill layoutId={finalImage?.id} />
              </div>
              {/* （2026-10-13 改，只有電腦版）封面上的案名大標＋地點／年份／類型：
                  - 兩案的文字都靠向中間分隔線——左欄靠右、右欄靠左（side），兩案的案名在畫面中央相對
                  - 大標是原本的 0.8 倍（60/72px → 48/58px）；資訊小字 18px（原本的 1.5 倍），改用跟大標
                    同一套字體（原本是等寬字），但不用粗體
                  - 欄位往下捲離開封面後文字淡出，同一側邊框的「2026常民竹小屋」同時換成案名（見
                    EdgeTitle.tsx、lib/coverReveal.ts）；捲回頂端文字再出現
                  同日曾試過在封面上加一層灰色半透明遮罩，不好看已拿掉。
                  手機版不顯示（手機的案名在欄位頂端的標頭裡，見上方 showHeader）。 */}
              <div
                aria-hidden={pastCover || undefined}
                className={`pointer-events-none absolute inset-0 z-10 hidden flex-col justify-end px-10 pb-10 transition-opacity duration-500 sm:flex ${
                  pastCover ? "opacity-0" : "opacity-100"
                } ${side === "left" ? "items-end text-right" : "items-start text-left"}`}
              >
                <h2 className="text-5xl leading-[0.95] font-black tracking-tight text-white uppercase lg:text-[57.6px]">{project.name}</h2>
                <p className="mt-3 text-[18px] font-normal tracking-wide uppercase" style={{ color: project.accent }}>
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
