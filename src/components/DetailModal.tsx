"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PANEL_BG } from "@/components/theme";

// 案例內頁的彈出式資訊視窗：從首頁點照片時，Next.js 的攔截路由（見 src/app/@modal/
// (.)projects/[slug]/page.tsx）會把 /projects/[slug] 蓋成這層 modal，首頁本身維持掛載
// 在背景不會被卸載——這就是「看得到雙欄模式」「章節標籤列共用」的機制基礎，不用另外
// 同步任何狀態，本來就是同一棵 React tree，首頁頂部現有的章節標籤列（TopChapterNav）
// 本來就還在畫面上、不會被這層蓋住；點了標籤這時會改成捲動這個 modal 裡的內容
// （見 SplitExhibition.tsx 的 TopChapterNav goTo 邏輯）。
//
// （已修正）不要背景暗化的灰色遮罩——只跟左右邊框留一圈「脫縫」（跟全站既有的 18px/30px
// 邊框同一組），上面緊接著章節標籤列、不加分隔線，看起來是同一塊延續下去的版面，不是
// 疊了一層灰灰的東西在上面。下面貼齊不留白（跟全站「ㄇ」型邊框同一個開口方向）。
//
// （已修正重要 bug，分兩層）點擊關閉原本是用一個蓋滿整個視窗的透明 `absolute inset-0` 點擊
// 區域（z-100），這會連首頁頂部那排 TopChapterNav 標籤列都一起蓋住——標籤列雖然畫面上看得到、
// 也在 DOM 裡，但視覺疊層上被這塊透明蓋板蓋在上面，導致「點標籤」其實點到的是蓋板本身，
// 直接觸發關閉、跳回雙欄首頁，而不是捲動視窗內容。改成只有左右「脫縫」玻璃條本身可以點擊
// 關閉，不再蓋住標籤列所在的區域。
//
// 光拿掉那層還不夠：最外層 `role="dialog"` 的 `fixed inset-0` 容器本身雖然沒有 onClick，
// 但它是一個實際佔滿整個視窗、預設 pointer-events:auto 的空 div，標籤列所在的那一截（面板
// 上方、還沒被面板本身蓋到的區域）一樣會被這層空 div「吃掉」點擊，點擊事件根本傳不到底下
// DOM 樹裡完全不同分支的 TopChapterNav。這裡整層補上 pointer-events-none，讓點擊直接穿透到
// 畫面上真正看得到的元素——面板本身、玻璃條都已經各自明講 pointer-events-auto，不受影響。
//
// 面板頂部的 top 偏移（70px / 106px）＝首頁 <main> 自己的上邊框內距（18px/30px，見
// (site)/layout.tsx 的 pt-[18px] sm:pt-[30px]）＋ TopChapterNav 明確寫死的高度
// （h-[52px]/h-[76px]，見 SplitExhibition.tsx）。之前只算了標籤列高度、漏算外層 <main>
// 的上內距，導致面板蓋住首頁的位置比標籤列真正結束的地方還高一截，中間夾了一小條露出來的
// 首頁內容，看起來像一條「量錯高度」的怪縫——這裡把兩段距離加總，才會跟標籤列的真實下緣
// 完全對齊，緊接著銜接。
//
// 液態玻璃質感移到左右「脫縫」本身——兩條跟 EdgeTitle（「2026林鐵構築」直書文字）同寬同位置
// 的玻璃條，z-index 特意比 EdgeTitle（z-40）低，讓文字疊在玻璃上維持清晰，玻璃只模糊文字
// 後面透出來的首頁內容，不是整個面板都用玻璃——面板內容本身維持跟獨立頁面一樣的實色。
//
// （已修正方向）脫縫不是靠一條實色分隔線去「畫出」邊界——那樣看起來只是一條灰線，不是玻璃。
// 真正的液態玻璃質感靠的是：強力模糊＋高飽和度讓底下雙欄首頁的顏色、明暗還能透出來（只是
// 變模糊，不是被蓋住），玻璃底色本身透明度壓得很低（只有一點點霧感，不是一片實色），邊界
// 靠一條極細、半透明的「反光」高光線（貼著面板那一側），像玻璃邊緣打到光，不是灰色框線。
//
// 光靠這條半透明玻璃條，脫縫本身還是太不明顯（尤其兩案首頁背景色不一定跟玻璃形成強對比）。
// 「這是蓋在首頁上面的獨立頁面」這個認知不能只靠脫縫的視覺差異來傳達，改成加投影
// （--panel-elevation-shadow）——這是比「兩個顏色的邊界在哪」更直覺的線索：有陰影落在旁邊，
// 就代表這塊面板是浮在首頁上方、有實際的高度差，不是首頁本身版面的一部分。
//
// （已修正）投影只要左右，上面要跟標籤列維持無縫銜接——不能用面板本身的 box-shadow（那樣
// 四周都會出現，上緣會在標籤列下面多一條陰影，把兩者「切開」）。改成把陰影直接畫在左右
// 玻璃條本身、做成由面板側往外淡出的線性漸層（linear-gradient），只存在於左右這兩條窄
// 範圍內，天生就不會跑到頂部，跟標籤列之間維持原本零縫隙的樣子。
//
// （已修正）脫縫（連同玻璃、投影）原本跟全站邊框共用 18px/30px 這組窄寬度，正好跟
// EdgeTitle「2026林鐵構築」直書文字同寬同位置——投影只要一淡出，範圍幾乎整條都蓋到文字
// 本身，看起來像陰影壓在字上。這裡把脫縫本身加寬到 44px/60px（比 EdgeTitle 寬，這兩個不用
// 再同寬），投影改用絕對距離（20px 內淡出，不是整條寬度的百分比）只貼著面板邊緣那一小段，
// 加寬後剩下的空間留給 EdgeTitle 文字，確保文字那一截是乾淨玻璃、沒有陰影。
//
// （已修正）點某張照片進來要直接捲到內文裡「這張照片」的位置（見 PhotoStream.tsx 的
// #${photo.id} 錨點），不能只靠瀏覽器原生的 hash 捲動——這裡是 Next.js 攔截路由的 client-side
// 導覽（不是整頁重新載入），瀏覽器原生「網址帶 hash 自動捲到該錨點」那套機制主要是為完整頁面
// 載入設計的，對這種 SPA 導覽、又是巢狀捲動容器（面板自己的 .overflow-y-auto，不是視窗本身）
// 不見得可靠。改成自己讀 location.hash，掛載後手動把面板捲到那個 id 的位置——用跟
// SplitExhibition.tsx 的 scrollChapterIntoView 同一套「量 id 元素相對捲動容器的偏移」算法。
//
// （已修正）剛掛載的那個瞬間，被點擊的那張照片本身正是 framer-motion layoutId 轉場動畫的
// 目標——它的 getBoundingClientRect() 在動畫還沒定格前會回報「飛行途中」暫時性的視覺座標，
// 不是最終版面位置，只在單一個 requestAnimationFrame 量一次很容易量到還在飛的中間值，算出來
// 的捲動位置就會是錯的（實測過，量到的偏移可以是 0 這種明顯不對的數字）。
//
// （已修正，第二輪）原本用「連續幾幀沒再移動就當作定格」判斷停手，但這個判斷本身也會出錯：
// 彈簧動畫（spring）中途可能出現速度趨近於零的短暫停頓，或量測當下剛好碰到那幾幀沒什麼位移
// ，會被誤判成「已經定格」提早收手，後面動畫其實還沒真的跑完，捲動位置就停在錯的地方——這正是
// 使用者回報「說明書封面沒有跳轉到內頁的說明書那頁」的原因（尤其那張封面是非同步從 PDF 畫出來
// 的，前面又多一段延遲，更容易撞上這個誤判)。改成不做「有沒有定格」的判斷，固定跑滿一段時間
// （現在是 1 秒），這段時間內每一幀都無條件重新量測、重新修正 scrollTop——不管轉場動畫實際
// 何時真正結束，只要是在這 1 秒內結束，最後幾幀的修正就會把捲動位置收斂到正確答案，不會因為
// 錯誤判斷「已經定格」而提早放棄。
//
// （已修正）關閉的時候是反過來：使用者在內文裡可能不是停在原本點進來那張照片——可能往下
// 捲看了別的章節。關閉時要讓首頁停在「關閉當下內文正在看的那張照片」，不是原地不動（原地
// 不動＝停在打開當下首頁原本的捲動位置，如果那時候首頁還在封面附近，關閉後就會看起來像
// 「跳回封面頁」）。做法：關閉前先在 modal 的捲動容器裡找目前最靠近頂端的
// [data-photo-anchor] 元素（跟内文每張照片的 id 容器同一批，見 ProjectDetail.tsx），
// 用它的 id 反查首頁 PhotoStream.tsx 裡同一個 id 的照片（排除 modal 自己裡面那份、找 DOM
// 外層 children 那份），把首頁對應欄位捲過去——跟開場那個「捲到某張照片」用同一套「量 id
// 元素相對捲動容器偏移」算法，方向相反而已。
export function DetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function close() {
    const scroller = document.querySelector('[role="dialog"] .overflow-y-auto');
    if (scroller instanceof HTMLElement) {
      const scrollerRect = scroller.getBoundingClientRect();
      const anchors = Array.from(scroller.querySelectorAll<HTMLElement>("[data-photo-anchor]"));

      let closest: HTMLElement | null = null;
      let closestDist = Infinity;
      for (const el of anchors) {
        const dist = Math.abs(el.getBoundingClientRect().top - scrollerRect.top - 16);
        if (dist < closestDist) {
          closestDist = dist;
          closest = el;
        }
      }

      if (closest?.id) {
        const homeEl = Array.from(document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(closest.id)}"]`)).find(
          (el) => !el.closest('[role="dialog"]'),
        );
        const homeScroller = homeEl?.closest(".overflow-y-auto");
        if (homeEl && homeScroller instanceof HTMLElement) {
          const offset = homeEl.getBoundingClientRect().top - homeScroller.getBoundingClientRect().top;
          homeScroller.scrollTop = homeScroller.scrollTop + offset - 16;
        }
      }
    }

    router.back();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    let rafId: number;
    const start = performance.now();
    const DURATION = 1000; // 涵蓋 framer-motion 預設彈簧轉場常見的收斂時間，不管動畫實際跑多久

    function tick(now: number) {
      // 一定要限定在 [role="dialog"] 裡面查——PhotoStream.tsx 的縮圖現在也掛了同一個
      // id={photo.id}（給 DetailModal 關閉時反查用，見上面 close() 的註解），modal 開著時
      // 畫面上同時有兩個一樣 id 的元素，不限定範圍的 document.getElementById 會抓到首頁那份
      // （DOM 順序在前），變成捲首頁自己的欄位、內文完全沒捲到，之前踩過這個坑。
      const el = document.querySelector<HTMLElement>(`[role="dialog"] #${CSS.escape(hash)}`);
      const scroller = el?.closest(".overflow-y-auto");
      if (el && scroller instanceof HTMLElement) {
        const offset = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        scroller.scrollTop = scroller.scrollTop + offset - 16;
      }

      // 不管這一幀有沒有找到目標、有沒有修正到，都無條件排下一幀，直到跑滿 DURATION——
      // 找不到目標可能只是元素還沒掛上來的瞬間，不是永久性的失敗，不該直接放棄。
      if (now - start < DURATION) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      {/* 左右脫縫的液態玻璃條，z-30（低於 EdgeTitle 的 z-40，文字才會浮在玻璃上面）。點這條
          玻璃本身可以關閉視窗（取代原本蓋滿全螢幕的透明點擊區），一條內側細線讓這條「脫縫」
          讀起來是刻意留白的設計，不是渲染失誤。 */}
      <button
        aria-label="關閉"
        onClick={close}
        className="fixed inset-y-0 z-30 w-[44px] cursor-pointer sm:w-[60px] left-0"
      >
        <span
          className="block h-full w-full backdrop-blur-2xl backdrop-saturate-200"
          style={{
            background: "linear-gradient(to left, var(--panel-elevation-shadow), transparent 20px), var(--edge-glass-bg)",
            boxShadow: "inset -1px 0 0 var(--edge-glass-border)",
          }}
        />
      </button>
      <button
        aria-label="關閉"
        onClick={close}
        className="fixed inset-y-0 z-30 w-[44px] cursor-pointer sm:w-[60px] right-0"
      >
        <span
          className="block h-full w-full backdrop-blur-2xl backdrop-saturate-200"
          style={{
            background: "linear-gradient(to right, var(--panel-elevation-shadow), transparent 20px), var(--edge-glass-bg)",
            boxShadow: "inset 1px 0 0 var(--edge-glass-border)",
          }}
        />
      </button>

      {/* 關閉鈕在最頂端那排（跟共用的章節標籤列同一條水平帶），不放進面板內容裡（原本
          absolute top-4 right-4 貼著面板自己的左上角，位置在標籤列下面一大截，看起來
          突兀）。（已修正）水平位置要落在面板本身的邊界「以內」，不能停在加寬後的玻璃
          脫縫空白裡——脫縫加寬只是為了閃開陰影，不是要讓圖標浮在裡面沒有依附。right 值
          比面板右邊界（44px/60px）再往內縮一點，讓整顆按鈕都疊在面板／照片上面。 */}
      <button
        onClick={close}
        aria-label="關閉"
        className="fixed top-[8px] right-[54px] z-[110] flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none transition-opacity hover:opacity-70 sm:top-[14px] sm:right-[74px]"
        style={{ backgroundColor: "var(--border-subtle)", color: "var(--panel-text)" }}
      >
        ×
      </button>

      <div className="pointer-events-none fixed inset-0 z-[100]" role="dialog" aria-modal="true">
        {/* 面板本體：左右脫縫加寬到 44px/60px（比全站邊框的 18px/30px 寬，特意跟 EdgeTitle
            文字錯開，見上方註解），上面緊接著章節標籤列、沒有分隔線，下面貼齊不留白。底色是
            跟獨立頁面一樣的 PANEL_BG。內容捲動區隱藏原生捲軸視覺（不影響捲動功能），跟站上
            其他捲動欄位一致。投影畫在左右玻璃條上（見下方），不是面板自己的 box-shadow，
            上緣才不會多一條線把面板跟標籤列切開。 */}
        <div
          className={`pointer-events-auto absolute top-[70px] right-[44px] bottom-0 left-[44px] flex flex-col overflow-hidden sm:top-[106px] sm:right-[60px] sm:left-[60px] ${PANEL_BG}`}
        >
          <div className="no-scrollbar h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
