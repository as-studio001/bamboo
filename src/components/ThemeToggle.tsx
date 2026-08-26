"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "light";
    setTheme(current);
  }, []);

  // 案例內頁彈出視窗開著的時候，這顆按鈕原本的 right-5/right-8（緊貼真正的視窗邊緣）會落在
  // DetailModal 加寬過的玻璃脫縫空白裡，離面板本身的內容有一大截距離，看起來浮在外面沒有
  // 依附。用 MutationObserver 偵測 [role="dialog"] 是否掛在畫面上（跟 SplitExhibition.tsx
  // 的 TopChapterNav 用同一招，直接查 DOM，不用額外同步狀態），視窗開著時把按鈕往內縮，
  // 疊到面板／照片本身的邊界以內。
  useEffect(() => {
    function check() {
      setModalOpen(!!document.querySelector('[role="dialog"]'));
    }
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  if (!theme) return null;

  return (
    <button
      onClick={toggle}
      aria-label="切換深色模式"
      className={`fixed bottom-5 z-[110] flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-colors sm:bottom-8 ${
        modalOpen ? "right-[64px] sm:right-[92px]" : "right-5 sm:right-8"
      }`}
      style={{ backgroundColor: "var(--panel-text)", color: "var(--panel-bg)" }}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
    </svg>
  );
}
