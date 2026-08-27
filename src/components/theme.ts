// 面板色彩／文字樣式共用常數，走 CSS 變數（見 globals.css 的 --panel-bg / --panel-text），
// 才能跟著 <html data-theme> 深色模式切換。首頁雙欄、案例內頁共用同一套視覺語言。
export const PANEL_BG = "bg-[var(--panel-bg)]";
export const TEXT_PRIMARY = "text-[var(--panel-text)]";
export const TEXT_BODY = "text-[var(--panel-text-muted)]";
export const TEXT_PAD = ""; // 拿掉左右內距，讓文字方塊跟滿版照片的邊緣對齊

// 照片 shared element 放大轉場（layoutId）共用的時間曲線——展覽規格書訂的動效原則是
// 「進場淡入位移 0.6–0.8s」，這裡取中間值，緩動曲線沿用 globals.css 的 .link-underline
// 同一條 cubic-bezier(0.22, 1, 0.36, 1)，跟全站底線展開動畫同一種「先快後慢」的質感，
// 不用 framer-motion 預設的彈簧（那個對這種尺寸差異大的轉場來說收斂太快，一下就結束，
// 反而不容易被注意到是「有轉場」，不是全站動效語言一致的問題，是純粹「太快看不出來」）。
export const SHARED_ELEMENT_TRANSITION = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };
