// 首頁電腦版「封面案名」與「兩側案名」共用的判斷（2026-10-13 新增）：兩欄各自捲動，某一欄往下捲
// 超過 COVER_REVEAL_PX，就當作「已經離開封面」——那一欄封面上的案名大標＋資訊淡出，
// 同一側邊框的「2026常民竹小屋」換成那一案的案名；捲回頂端則恢復。SplitExhibition.tsx 的 Panel
// 跟 EdgeTitle.tsx 各自監聽欄位捲動，用同一個門檻，兩邊才會同時切換。
export const COVER_REVEAL_PX = 40;

export function isPastCover(scroller: HTMLElement) {
  return scroller.scrollTop > COVER_REVEAL_PX;
}

// 首頁兩欄各自的捲動容器，依畫面順序（左欄、右欄）。不含案例彈出視窗裡的捲動容器。
export function exhibitionScrollers(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("#exhibition .overflow-y-auto"));
}
