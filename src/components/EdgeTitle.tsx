"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { exhibitionScrollers, isPastCover } from "@/lib/coverReveal";
import { backdropLuminance } from "@/lib/backdropLuminance";

const TITLE = "2026常民竹小屋";

type EdgeProject = { name: string; slug: string };
type Mode = "brand" | "name" | "hidden";
type Tone = "dark" | "light";

// 標題整併進三周白色邊框裡，貼著左右兩側直書呈現，參考 Meili Vogt Conzett 的邊界直書標題處理。
// 用 fixed（不是 absolute）貼在視窗邊緣——首頁雙欄整頁固定 100dvh 不捲動，兩種定位視覺上沒差別；
// 但案例內頁是一般可捲動文件，absolute 會被撐得跟內容一樣高，要用 fixed 才會一路貼齊視窗邊緣。
//
// side 預設兩側都顯示（首頁用法）；案例內頁的左側邊框改放章節導覽（見 ProjectDetail.tsx 的
// ChapterEdgeNav），取代這裡的品牌文字，所以內頁只會傳 side="right"，保留右側的「2026林鐵構築」。
//
// 點「2026常民竹小屋」要回到首頁最上面的「策展宣言」。首頁真正在捲的是 (site)/layout.tsx 的
// <main>（不是視窗），單靠 <Link href="/"> 在首頁上點不會捲回去，所以：
// - 畫面上有宣言頁（首頁本身、或首頁上開著案例彈出視窗）：自己把宣言頁捲進畫面；在首頁時
//   擋掉 Link 的導覽，彈出視窗時照常導覽回「/」把視窗關掉，同時捲回宣言
// - 案例獨立頁面（沒有宣言頁）：照常導覽回首頁，首頁重新掛載本來就從宣言開始
//
// （2026-10-13，只有電腦版）首頁會傳 projects（左欄、右欄兩案），兩側標示依狀態切換：
// - 策展宣言、活動那兩屏：「2026常民竹小屋」
// - 「兩欄展覽」那一屏、那一欄還停在封面（第一張圖）：那一側不放字（封面上已經有案名大標）
// - 那一欄往下捲離開封面後（見 lib/coverReveal.ts）：換成該欄的案名，點下去打開該案的案例頁
//   （從首頁點會被攔截成彈出視窗）。案名跟「2026常民竹小屋」同一套字體、大小
// 首頁電腦版左右不留白邊，字直接壓在圖上、不墊底色；字色依背後實際看到的畫面亮度在深灰／淺灰
// 之間切換（見 lib/backdropLuminance.ts），亮背景用深灰、暗背景用淺灰，切換時淡入淡出。
// 手機版維持原本 18px 白邊＋「2026常民竹小屋」。
// （2026-10-14）在案例內頁時，右側的「2026常民竹小屋」後面接「 × 案名」，例如「2026常民竹小屋 × 竹輕亭 | 簇樂」：
// - 案例獨立頁：projects/[slug]/layout.tsx 傳 projectName
// - 首頁上開著的案例彈出視窗：網址是 /projects/<slug>，從首頁傳進來的 projects 裡找出案名
// 這時右側固定顯示這串字（不套首頁兩欄的「封面隱藏／換成案名」規則），點了照舊回到策展宣言。
// （2026-10-15，電腦版）案例封面滿版後，右側這串字在封面上不顯示，封面往上捲過半個畫面才淡入
// （見 useOnProjectCover）。
export function EdgeTitle({
  side = "both",
  projects,
  projectName,
}: {
  side?: "left" | "right" | "both";
  projects?: [EdgeProject, EdgeProject];
  projectName?: string;
}) {
  const pathname = usePathname();
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLAnchorElement>(null);
  const { modes, tones, adaptive } = useHomeEdgeState(!!projects, [leftRef, rightRef]);
  const currentProjectName = projectName ?? projects?.find((p) => pathname === `/projects/${p.slug}`)?.name;
  const onProjectCover = useOnProjectCover(!!currentProjectName, pathname);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const manifesto = document.getElementById("manifesto");
    if (!manifesto) return;
    if (pathname === "/") e.preventDefault();
    manifesto.scrollIntoView({ behavior: "smooth" });
  }

  function renderSide(index: 0 | 1) {
    const isLeft = index === 0;
    const project = projects?.[index];
    const withProject = !isLeft && !!currentProjectName;
    const mode = withProject ? (onProjectCover ? "hidden" : "brand") : modes[index];
    const showName = mode === "name" && project;
    const label = withProject ? `${TITLE} × ${currentProjectName}` : showName ? project.name : TITLE;
    const frame = projects
      ? `w-[18px] sm:w-auto ${isLeft ? "left-0 sm:left-2" : "right-0 sm:right-2"}`
      : `w-[18px] sm:w-[30px] ${isLeft ? "left-0" : "right-0"}`;
    const color = adaptive && !withProject ? (tones[index] === "dark" ? "#222222" : "#eeeeee") : "var(--foreground)";
    // 首頁整頁捲軸已隱藏（見 (site)/layout.tsx），左右兩側標示都離圖片邊緣 8px，完全對稱。

    return (
      <div className={`pointer-events-none fixed inset-y-0 z-40 flex items-center justify-center ${frame}`}>
        <Link
          ref={isLeft ? leftRef : rightRef}
          href={showName ? `/projects/${project.slug}` : "/"}
          prefetch={false}
          onClick={showName ? undefined : handleClick}
          aria-label={label}
          aria-hidden={mode === "hidden" || undefined}
          tabIndex={mode === "hidden" ? -1 : undefined}
          className={`py-3 transition-[opacity,color] duration-500 ${
            mode === "hidden" ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
          style={{ color }}
        >
          <span className="block [writing-mode:vertical-rl] font-serif-tc text-[10px] tracking-[0.2em] uppercase sm:text-xs">
            {label}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <>
      {(side === "left" || side === "both") && renderSide(0)}
      {(side === "right" || side === "both") && renderSide(1)}
    </>
  );
}

// 案例內頁（獨立頁或首頁上的彈出視窗）電腦版：封面（ProjectDetail 的 DetailHero，帶
// data-project-cover）還佔著畫面上半部時回傳 true。封面可能比這裡晚掛載（彈出視窗開啟中），
// 所以每次都重新找元素；捲動用 capture 一併接到彈出視窗內部捲動區的事件。
function useOnProjectCover(enabled: boolean, pathname: string) {
  const [onCover, setOnCover] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const mql = window.matchMedia("(min-width: 640px)");
    let rafId: number | null = null;
    const check = () => {
      rafId = null;
      const covers = document.querySelectorAll<HTMLElement>("[data-project-cover]");
      const cover = covers[covers.length - 1];
      setOnCover(!!cover && mql.matches && cover.getBoundingClientRect().bottom > window.innerHeight / 2);
    };
    const schedule = () => {
      if (rafId === null) rafId = requestAnimationFrame(check);
    };
    schedule();
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const interval = window.setInterval(schedule, 400);
    return () => {
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.clearInterval(interval);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled, pathname]);

  return enabled && onCover;
}

// 首頁電腦版兩側標示的狀態：顯示什麼（modes）、用深灰還是淺灰（tones）。
// enabled＝首頁（有傳 projects）；adaptive＝目前是電腦版，字色才依背景切換。
function useHomeEdgeState(enabled: boolean, refs: React.RefObject<HTMLAnchorElement | null>[]) {
  const [onExhibition, setOnExhibition] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [past, setPast] = useState<[boolean, boolean]>([false, false]);
  const [tones, setTones] = useState<[Tone, Tone]>(["dark", "dark"]);
  const tonesRef = useRef<[Tone, Tone]>(["dark", "dark"]);

  useEffect(() => {
    if (!enabled) return;
    const mql = window.matchMedia("(min-width: 640px)");
    const updateDesktop = () => setIsDesktop(mql.matches);
    updateDesktop();
    mql.addEventListener("change", updateDesktop);

    const el = document.getElementById("exhibition");
    const observer = el
      ? new IntersectionObserver(([entry]) => setOnExhibition(entry.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] })
      : null;
    if (el && observer) observer.observe(el);

    const scrollers = exhibitionScrollers().slice(0, 2);
    const main = document.querySelector("main");

    // 字色：量標示背後的亮度。加一段遲滯（亮度 > 0.55 才換深灰、< 0.45 才換淺灰），亮度剛好在
    // 中間時不會來回閃。捲動時用 requestAnimationFrame 合併成一影格量一次；另外每 0.8 秒補量
    // 一次，處理圖片延遲載入、標示文字切換後尺寸改變這類不會觸發捲動的情況。
    let rafId: number | null = null;
    function measureTones() {
      rafId = null;
      if (!mql.matches) return;
      const next: [Tone, Tone] = [...tonesRef.current];
      refs.forEach((ref, i) => {
        const label = ref.current;
        if (!label || getComputedStyle(label).opacity === "0") return;
        const lum = backdropLuminance(label.getBoundingClientRect(), label);
        if (lum === null) return;
        if (lum > 0.55) next[i] = "dark";
        else if (lum < 0.45) next[i] = "light";
      });
      if (next[0] !== tonesRef.current[0] || next[1] !== tonesRef.current[1]) {
        tonesRef.current = next;
        setTones(next);
      }
    }
    const scheduleMeasure = () => {
      if (rafId === null) rafId = requestAnimationFrame(measureTones);
    };

    const updatePast = () => {
      setPast([!!scrollers[0] && isPastCover(scrollers[0]), !!scrollers[1] && isPastCover(scrollers[1])]);
      scheduleMeasure();
    };
    updatePast();
    scrollers.forEach((s) => s.addEventListener("scroll", updatePast, { passive: true }));
    main?.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    const interval = window.setInterval(scheduleMeasure, 800);

    return () => {
      mql.removeEventListener("change", updateDesktop);
      observer?.disconnect();
      scrollers.forEach((s) => s.removeEventListener("scroll", updatePast));
      main?.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      window.clearInterval(interval);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // refs 是固定的 ref 物件，不會變
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const adaptive = enabled && isDesktop;
  const modeFor = (i: 0 | 1): Mode => {
    if (!adaptive || !onExhibition) return "brand";
    return past[i] ? "name" : "hidden";
  };
  return { modes: [modeFor(0), modeFor(1)] as [Mode, Mode], tones, adaptive };
}
