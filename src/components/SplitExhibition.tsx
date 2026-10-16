"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOME_CHAPTER_KEYS, homeCover, orderedChapters, type Project } from "@/lib/projects";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { PhotoStream } from "@/components/PhotoStream";
import { ChapterMap } from "@/components/ChapterExtras";
import { AdminAccessLink } from "@/components/AdminAccessLink";
import { chapterLabel, navColor } from "@/lib/chapters";
import { exhibitionScrollers, isPastCover } from "@/lib/coverReveal";
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
      {/* （2026-10-15，只有電腦版）底部 30px 白邊，跟最上面的細白邊上下對稱。正中間放橫寫的
          「2026常民竹小屋」（這一屏兩側邊框不顯示字；同日從右下角移到中間），點了回到策展宣言；
          左邊同一高度是齒輪（AdminAccessLink，fixed）。照片高度由 Panel 量 --slot-h 自動扣掉這條白邊。 */}
      <div className="hidden h-[30px] shrink-0 items-center justify-center sm:flex">
        <button
          onClick={() => document.getElementById("manifesto")?.scrollIntoView({ behavior: "smooth" })}
          className="font-serif-tc text-xs tracking-[0.2em] text-[var(--foreground)] opacity-80 transition-opacity hover:opacity-100"
        >
          2026常民竹小屋
        </button>
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

// 一張一頁的滾輪捲動（2026-10-13 改，取代原本的自訂慣性捲動）：
// 電腦版首頁每張照片（封面、照片索引的每一張、最後的基地地圖）都佔滿欄位一整屏的高度（見 Panel
// 的 --slot-h、PhotoStream.tsx），外層掛 data-snap。滾輪不再自由慣性滑動，而是「一次滾動手勢＝
// 換一頁」：往下就對齊到下一個 data-snap 的上緣、往上對齊到上一個，畫面上永遠只有一張，不會切到
// 上下其他圖。原本的慣性捲動停下來時常常同時露出上一張的尾巴跟下一張的開頭，這是改掉的原因。
//
// 「一次手勢」的判斷：兩次 wheel 事件間隔超過 WHEEL_GESTURE_GAP_MS 才算新的一次——觸控板一次
// 撥動會連續送出一長串事件（含放手後的慣性事件），這些都只算一次、只換一頁；換頁動畫進行中的
// 滾輪也不會再疊加。
const WHEEL_GESTURE_GAP_MS = 200;
const PAGE_DURATION_MS = 550;

// 欄位裡所有翻頁停靠點（相對捲動容器頂端的 scrollTop 值），由上到下、去重。
function pageStops(scroller: HTMLElement) {
  const top = scroller.getBoundingClientRect().top;
  const max = scroller.scrollHeight - scroller.clientHeight;
  const stops = Array.from(scroller.querySelectorAll<HTMLElement>("[data-snap]")).map((el) =>
    Math.min(max, Math.max(0, Math.round(scroller.scrollTop + el.getBoundingClientRect().top - top))),
  );
  stops.push(0, max);
  return Array.from(new Set(stops)).sort((a, b) => a - b);
}

// 欄位在 scrollTop＝top 時停在哪一章：上緣已經進到欄位上半部的最後一個章節群組（PhotoStream 的
// data-chapter，加上基地地圖）。還在封面（第一章之前）回傳 null。
// 章節群組的位置用 offsetTop 換算成相對捲動容器的距離，不受捲動動畫進行到一半影響。
function chapterAt(scroller: HTMLElement, top = scroller.scrollTop): string | null {
  const base = scroller.getBoundingClientRect().top - scroller.scrollTop;
  let key: string | null = null;
  scroller.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
    if (el.getBoundingClientRect().top - base <= top + scroller.clientHeight / 2) key = el.dataset.chapter ?? null;
  });
  return key;
}

// （2026-10-15，只有電腦版）兩欄章節同步：一欄翻頁後換到另一章（或回到封面），另一欄也一起捲到
// 同一章的開頭（回封面就一起回封面），兩案永遠在看同一章。另一欄本來就在那一章、或沒有那一章時不動。
function syncOtherPanel(scroller: HTMLElement, target: number) {
  if (!window.matchMedia("(min-width: 640px)").matches) return;
  const other = exhibitionScrollers().find((s) => s !== scroller);
  if (!other) return;
  const key = chapterAt(scroller, target);
  if (key === chapterAt(scroller) || key === chapterAt(other)) return;
  if (key === null) {
    animateScrollTo(other, 0, PAGE_DURATION_MS);
    return;
  }
  const anchor = other.querySelector<HTMLElement>(`[data-chapter="${key}"]`);
  if (!anchor) return;
  const offset = anchor.getBoundingClientRect().top - other.getBoundingClientRect().top;
  animateScrollTo(other, other.scrollTop + offset, PAGE_DURATION_MS);
}

// 欄位已經在最頂還往上滾、或在最底還往下滾時，不攔截這次滾輪，讓它照瀏覽器原生行為往上傳給整頁
// 捲動容器（(site)/layout.tsx 的 main，scroll-snap），切到「策展宣言」或「活動」那一屏——
// 這樣滑鼠停在欄位上任何位置都能捲到首頁最上方跟最下方，不用先移到空白處。
function usePanelWheelScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastWheelTime = 0;
    let handingOff = false; // 這一串滾動已經交給整頁捲動，連續事件就繼續交出去，不中途又被欄位攔下

    function onWheel(e: WheelEvent) {
      const now = performance.now();
      const isNewGesture = now - lastWheelTime > WHEEL_GESTURE_GAP_MS;
      lastWheelTime = now;
      if (e.deltaY === 0) return;

      const dir = Math.sign(e.deltaY);
      const current = el!.scrollTop;
      const max = el!.scrollHeight - el!.clientHeight;
      const animating = scrollAnimations.has(el!);
      const pushingPastEdge = (dir < 0 && current <= 1) || (dir > 0 && current >= max - 1);
      if (pushingPastEdge && !animating && (handingOff || isNewGesture)) {
        handingOff = true;
        return;
      }
      handingOff = false;

      e.preventDefault();
      if (!isNewGesture || animating) return; // 同一次手勢只換一頁

      const stops = pageStops(el!);
      const target =
        dir > 0 ? (stops.find((s) => s > current + 2) ?? max) : ([...stops].reverse().find((s) => s < current - 2) ?? 0);
      animateScrollTo(el!, target, PAGE_DURATION_MS);
      syncOtherPanel(el!, target);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);
}

// 只捲動目標所在的那個欄位自己的捲動容器（.overflow-y-auto），不用瀏覽器內建的
// scrollIntoView——它預設會把沿路所有「可捲動」的祖先都一起捲（main 雖然設了
// overflow-hidden，但程式仍能捲它），結果連標籤列所在的外層框都被捲走、消失不見。
// gap：目標上緣離捲動容器頂端留多少空間。首頁欄位是一張一頁，要剛好對齊（0），不然會露出上一張
// 的尾巴；案例彈出視窗裡是一般長文，留 16px 呼吸空間。
function scrollChapterIntoView(id: string, gap = 16) {
  const el = document.getElementById(id);
  const scroller = el?.closest(".overflow-y-auto");
  if (!el || !(scroller instanceof HTMLElement)) return;
  const offset = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  animateScrollTo(scroller, scroller.scrollTop + offset - gap);
}

// 頂部標籤列：只出現一次，貼在邊框內、兩欄的共用頂部，橫向排列，跟案例內頁彈出視窗
// （DetailModal）共用同一份，不會分別各畫一份。點一個標籤：
// - 有案例內頁彈出視窗開著的話，改成捲動那個視窗自己的內容段落（ProjectDetail 裡的章節
//   區塊 id 是不帶案名前綴的純 key，例如 id="module"，跟首頁 `${slug}-module` 這種有前綴
//   的錨點不會撞名，用這個特徵就能判斷「現在要捲的是視窗內容，不是首頁」）
// - 沒有視窗開著，維持原本行為：A、B 兩案同步捲到各自「這個章節的照片群組」（PhotoStream
//   用同一個 id={`${slug}-${key}`} 錨點，因為照片本身就直接借用章節的圖片，天生知道自己
//   屬於哪個章節，這裡才能準確定位）
// 頂部標籤列要標出的「目前章節」：
// - 案例彈出視窗開著：視窗裡上緣已經進到畫面上半部的最後一個章節區塊（ProjectDetail 的 section id＝章節 key）
// - 首頁兩欄：最近一次捲動的那一欄目前停在哪一章（chapterAt）；兩欄平常會同步在同一章
// 還在封面時回傳 null。監聽所有捲動（capture），用 requestAnimationFrame 合併成一影格算一次；
// 網址變了（開／關彈出視窗）也重算一次。
function useActiveChapter(): string | null {
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let source: HTMLElement | null = null;
    let raf: number | null = null;
    const measure = () => {
      raf = null;
      let key: string | null = null;
      const modal = document.querySelector<HTMLElement>('[role="dialog"] .overflow-y-auto');
      if (modal) {
        const mid = modal.getBoundingClientRect().top + modal.clientHeight / 2;
        modal.querySelectorAll<HTMLElement>("section[id]").forEach((s) => {
          if (s.getBoundingClientRect().top <= mid) key = s.id;
        });
      } else {
        const scrollers = exhibitionScrollers();
        const s = source && scrollers.includes(source) ? source : scrollers[0];
        if (s) key = chapterAt(s);
      }
      setActive(key);
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(measure);
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof HTMLElement && e.target.closest("#exhibition")) source = e.target;
      schedule();
    };
    schedule();
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return active;
}

// 兩欄各自是否已經往下捲離開封面（lib/coverReveal.ts 的同一個門檻），給頂部列兩端的案名用。
function usePastCovers(): [boolean, boolean] {
  const [past, setPast] = useState<[boolean, boolean]>([false, false]);
  useEffect(() => {
    let raf: number | null = null;
    const measure = () => {
      raf = null;
      const [l, r] = exhibitionScrollers();
      const next: [boolean, boolean] = [!!l && isPastCover(l), !!r && isPastCover(r)];
      setPast((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next));
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(measure);
    };
    schedule();
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", schedule, { capture: true });
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);
  return past;
}

function TopChapterNav({ projects }: { projects: [Project, Project] }) {
  const [a, b] = projects;

  function goTo(key: string) {
    // （2026-10-13）「設計」（design）是第一個章節，點了回到最上面的封面大圖（scrollTop 0），
    // 不是捲到封面下面的第一張設計照片；案例彈出視窗開著時，也是把視窗捲回最上面的封面。
    if (key === "design") {
      const modalScroller = document.querySelector('[role="dialog"] .overflow-y-auto');
      if (modalScroller instanceof HTMLElement) {
        animateScrollTo(modalScroller, 0);
        return;
      }
      exhibitionScrollers().forEach((s) => animateScrollTo(s, 0));
      return;
    }
    const modalTarget = document.querySelector(`[role="dialog"] #${CSS.escape(key)}`);
    if (modalTarget) {
      // 彈出視窗裡的章節上緣剛好對齊視窗頂端（gap 0）：案例內頁電腦版有「停下來自動對齊章節」，
      // 差 16px 會被再補捲一次，看起來像抖一下
      scrollChapterIntoView(key, 0);
      return;
    }
    scrollChapterIntoView(`${a.slug}-${key}`, 0);
    scrollChapterIntoView(`${b.slug}-${key}`, 0);
  }

  // 「活動」不是章節，是整個展覽共用的一份（見 lib/events.ts），只放在首頁（2026-10-14 起案例內頁
  // 不再顯示活動區塊）：整頁捲到首頁最尾端的活動畫面（id="events-screen"）。
  function goToEvents() {
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
  // （2026-10-15）字體改成跟兩側直書「2026常民竹小屋」（EdgeTitle）同一套襯線字（粗體），大小與顏色不變。
  const labelClass =
    "relative font-serif-tc font-bold text-[10px] tracking-wide uppercase text-foreground before:absolute before:-inset-x-2 before:-inset-y-4 before:content-[''] min-[400px]:before:-inset-x-3 sm:text-sm";

  // （2026-10-15，只有電腦版）目前所在的章節標籤維持原色，其他標籤變淡；還在封面時全部原色。
  const active = useActiveChapter();
  const dimClass = (key: string) =>
    `transition-opacity duration-300 ${active && active !== key ? "sm:opacity-35 sm:hover:opacity-70" : ""}`;
  const pastCovers = usePastCovers();

  return (
    <div className="relative flex h-[52px] shrink-0 items-center justify-center gap-4 min-[400px]:gap-6 sm:h-[76px] sm:gap-10">
      {/* （2026-10-15，只有電腦版）兩案案名放在這一列的左右兩端（左案在左欄正上方、右案在右欄正上方），
          取代原本兩側邊框的直書案名（EdgeTitle 在這一屏改成不顯示）。跟章節標籤同一套字（襯線粗體、
          同大小同顏色）；那一欄還停在封面時不顯示（封面上已經有案名大標），往下捲離開封面才淡入。
          點案名打開該案的案例頁（從首頁點會被攔截成彈出視窗）。 */}
      {projects.map((p, i) => (
        <Link
          key={p.slug}
          href={`/projects/${p.slug}`}
          prefetch={false}
          aria-hidden={!pastCovers[i] || undefined}
          tabIndex={pastCovers[i] ? undefined : -1}
          className={`absolute top-1/2 hidden -translate-y-1/2 font-serif-tc text-sm font-bold tracking-wide text-foreground uppercase transition-opacity duration-500 sm:block ${
            i === 0 ? "left-8" : "right-8"
          } ${pastCovers[i] ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={navStyle}
        >
          {p.name}
        </Link>
      ))}
      {/* 只列首頁會出現的章節（團隊介紹、結構設計只在案例內頁），照固定順序 */}
      {orderedChapters(a, HOME_CHAPTER_KEYS).map((chapter) => (
        <button
          key={chapter.key}
          onClick={() => goTo(chapter.key)}
          aria-current={active === chapter.key || undefined}
          className={`${labelClass} ${dimClass(chapter.key)}`}
          style={navStyle}
        >
          {chapterLabel(chapter.key)}
        </button>
      ))}
      <button onClick={goToEvents} className={`${labelClass} ${dimClass("events")}`} style={navStyle}>
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
  // （2026-10-15）用後台指定的「首頁封面」，沒指定就用最後一張（見 projects.ts 的 homeCover）
  const finalImage = homeCover(project);

  // 電腦版封面上的案名：欄位還停在封面時顯示，往下捲超過門檻就淡出（見 lib/coverReveal.ts）。
  // 同時把欄位可見高度寫進 CSS 變數 --slot-h：電腦版每張照片（PhotoStream.tsx）與最後的基地地圖
  // 都用這個高度佔滿一整屏，配合 usePanelWheelScroll 一張一頁。用 ResizeObserver 跟著視窗大小更新。
  const [pastCover, setPastCover] = useState(false);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => setPastCover(isPastCover(el));
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(() => el.style.setProperty("--slot-h", `${el.clientHeight}px`));
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
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
          <h2 className="truncate font-serif-tc text-3xl leading-[1.05] font-black tracking-tight text-[#141414] uppercase">{project.name}</h2>
          <p className="mt-2 truncate font-serif-tc text-[11px] tracking-wide text-[#141414] uppercase">
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
              className={`mt-3 [writing-mode:vertical-rl] font-serif-tc font-black tracking-[0.15em] uppercase leading-none text-sm ${TEXT_PRIMARY}`}
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
                <h2 className="font-serif-tc text-5xl leading-[1.05] font-black tracking-tight text-white uppercase lg:text-[57.6px]">{project.name}</h2>
                <p className="mt-3 font-serif-tc text-[18px] font-normal tracking-wide uppercase" style={{ color: project.accent }}>
                  {project.location} · {project.year} · {project.type}
                </p>
              </div>
            </Link>

            {/* 首頁雙欄現在只留「圖片＋簡短說明」的照片索引，跟基地地圖。整體論述、六個章節的完整
                文字都移到 /projects/[slug] 案例內頁（見 ProjectDetail.tsx），這裡不重複放。 */}
            {/* 電腦版一張一頁：照片之間、上下都不留空白，基地地圖也佔滿一整屏（置中）、掛 data-snap
                當最後一頁，翻到底不會露出半張照片。手機版維持原本的間距。 */}
            <div className="pt-8 pb-24 sm:p-0">
              <PhotoStream project={project} />
              <div
                id={`${project.slug}-site`}
                data-chapter="site"
                data-snap
                className="scroll-mt-4 pt-8 sm:flex sm:h-[var(--slot-h)] sm:flex-col sm:justify-center sm:px-10 sm:pt-0"
              >
                <ChapterMap project={project} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
