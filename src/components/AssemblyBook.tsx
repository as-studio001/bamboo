"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "@/lib/projects";
import { PdfFlipbook } from "@/components/PdfFlipbook";
import { pdfCoverId } from "@/lib/pdfPages";
import { usePdfCover } from "@/lib/usePdfCover";
import { TEXT_BODY } from "@/components/theme";

// 「組裝說明書」的 PDF 上架元件：封面圖放大成跟其他章節（NarrativeSection 的 leadImage）
// 同一個尺寸級別（h-64/h-96/28rem），不是縮圖——這一章的封面本身就是主要視覺，不用縮小處理。
// 點封面圖或「線上翻閱」都會開啟翻書檢視視窗（PdfFlipbook.tsx，pdf.js＋react-pageflip，
// 比照 https://pineapplehsieh.github.io/anassembly-studio/#/books 那套做法）。
//
// id／layoutId 用 pdfCoverId(project)，跟 PhotoStream.tsx 首頁縮圖那張圖共用同一個字串——
// 從首頁點封面進來的 shared element 轉場、DetailModal.tsx 關閉時的「捲回同一張圖」都靠這個
// id 對得上，跟其他章節的照片是同一套機制，這裡不例外處理。
export function AssemblyBook({ project, pdf, accent }: { project: Project; pdf: { url: string; label: string }; accent: string }) {
  const [open, setOpen] = useState(false);
  const coverSrc = usePdfCover(pdf.url);
  const id = pdfCoverId(project);

  return (
    <div className="mt-6 sm:mt-8">
      <motion.button
        layoutId={id}
        id={id}
        data-photo-anchor
        onClick={() => setOpen(true)}
        aria-label={`翻閱${pdf.label}`}
        className="group relative block h-64 w-full scroll-mt-4 overflow-hidden text-left sm:h-96 lg:h-[28rem]"
      >
        {coverSrc && (
          // PDF 頁面是完整版面（含邊界留白），用 object-cover 會裁掉四周——這裡改
          // object-contain，圖不裁切、按長寬比縮放置中，跟其他章節滿版裁切的照片不同處理。
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 font-mono text-xs tracking-widest text-white uppercase opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          線上翻閱
        </span>
      </motion.button>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          onClick={() => setOpen(true)}
          className="font-mono text-[10px] tracking-wide uppercase underline underline-offset-2 sm:text-xs"
          style={{ color: accent }}
        >
          線上翻閱
        </button>
        <a
          href={pdf.url}
          download
          className="font-mono text-[10px] tracking-wide uppercase underline underline-offset-2 sm:text-xs"
          style={{ color: accent }}
        >
          下載 PDF
        </a>
      </div>

      {open && <PdfFlipbook url={pdf.url} label={pdf.label} accent={accent} onClose={() => setOpen(false)} />}
    </div>
  );
}
