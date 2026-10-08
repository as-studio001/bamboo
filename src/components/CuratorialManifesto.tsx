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
          2026 常民竹小屋
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-3xl sm:mt-8"
        >
          <p className="font-serif-tc text-2xl leading-[1.7] font-medium sm:text-3xl lg:text-[2.35rem]">
            竹構的下一步｜Bamboo, Reconfigured
          </p>
          <p className="font-serif-tc text-lg leading-[1.7] font-medium sm:text-xl lg:text-[1.5rem]">
            ☉常民使用的當代竹構<br />
            ☉模組化的未來竹構<br />
            ☉可與業主共同創造的竹構<br />
            <br />
            竹，不只是傳統材料，也不只是被重新詮釋的自然建材。<br />
            本展覽從「竹構如何被建造」出發，重新思考竹構建築的可能性。
          </p>
          <p
            className="mt-6 max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: "var(--foreground-muted)" }}
          >
            首先，讓竹構築回到常民生活，親近日常使用的需求，成為人們可以休憩、閱讀、聚會、工作與生活的場所；竹構不再只是節慶、藝術或活動中的展示物，而是一種真正被使用、被喜愛，並能持續融入當代生活的建築形式。<br />
            在此基礎上，進一步思考竹構如何被建造：如何將竹材轉化為可以被標準化、拆解、組裝、替換與再利用的構件系統；又如何透過使用者與業主的參與，讓同一套系統產生不同的空間結果。<br />
            因此，竹小屋不是一個固定的完成品，而是一套可以持續生成、隨著不同使用者與生活情境演變的竹構系統。
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
