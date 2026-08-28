"use client";

import { motion } from "framer-motion";

// 首頁最上面新增的第一個畫面——「策展宣言」，點進網站先看到這個滿版的宣言頁，向下捲動
// （或點下面的捲動提示）才會進到現有的兩欄並列版面（SplitExhibition）。這一頁不屬於任何
// 一個建築案，是整個展覽層級的論述，跟 project.intro（各案自己的簡介）分開——那個是「這個
// 案子在說什麼」，這裡是「這場展覽為什麼存在」。
//
// 版面刻意留白、非對稱（文字靠左、不置中），跟展覽規格書「編輯雜誌感、非對稱排列」的
// 調性一致；不用滿版照片當背景——這裡代表的是整個展覽，不是某一個案子，用任何一個案子的
// 照片當背景都會造成偏袒的觀感，純文字反而更中性。
//
// 進場淡入位移沿用全站動效原則（20px／0.6~0.8s）；底部的「向下捲動」提示用緩慢的上下
// 浮動＋淡入淡出循環，克制、不搶戲，純粹當作一個「這裡還沒完，往下捲」的視覺線索。
export function CuratorialManifesto() {
  function scrollToExhibition() {
    document.getElementById("exhibition")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative flex h-[100dvh] w-full shrink-0 snap-start flex-col justify-between overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex flex-1 flex-col justify-center px-6 pt-16 pb-10 sm:px-12 sm:pt-20 lg:px-20">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-[10px] tracking-[0.25em] uppercase sm:text-xs"
          style={{ color: "var(--foreground-muted)" }}
        >
          2026 林鐵構築 · 策展宣言
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-3xl sm:mt-8"
        >
          <p className="font-serif-tc text-2xl leading-[1.7] font-medium sm:text-3xl lg:text-[2.35rem]">
            〔佔位文字，抓版面用〕這是一場關於構造的展覽，也是一場關於等待的展覽。竹子從林間被砍下，經過選料、防腐、裁切，最終被人的雙手一根一根綁紮起來，成為可以遮蔭、可以停留的空間。
          </p>
          <p
            className="mt-6 max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: "var(--foreground-muted)" }}
          >
            常民竹小屋與一籌，分別回應了「長久」與「暫留」兩種截然不同的居住想像，並置在同一片林鐵沿線的土地上，邀請觀者重新思考構造、材料與時間之間的關係。這段文字之後會替換成正式的策展論述。
          </p>
        </motion.div>
      </div>

      <motion.button
        onClick={scrollToExhibition}
        aria-label="向下捲動查看展覽"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="group flex flex-col items-center gap-2 self-center pb-8 sm:pb-10"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span
            className="font-mono text-[9px] tracking-[0.2em] uppercase transition-opacity group-hover:opacity-100 sm:text-[10px]"
            style={{ color: "var(--foreground-muted)" }}
          >
            Scroll
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4v16M6 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </motion.button>
    </section>
  );
}
