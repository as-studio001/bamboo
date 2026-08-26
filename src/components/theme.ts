// 面板色彩／文字樣式共用常數，走 CSS 變數（見 globals.css 的 --panel-bg / --panel-text），
// 才能跟著 <html data-theme> 深色模式切換。首頁雙欄、案例內頁共用同一套視覺語言。
export const PANEL_BG = "bg-[var(--panel-bg)]";
export const TEXT_PRIMARY = "text-[var(--panel-text)]";
export const TEXT_BODY = "text-[var(--panel-text-muted)]";
export const TEXT_PAD = ""; // 拿掉左右內距，讓文字方塊跟滿版照片的邊緣對齊
