// 章節名稱是兩個案例共用的一份，跟「活動」「策展宣言」一樣走 git-based CMS：存在
// content/chapters.json，後台 /admin 的「章節標題」編輯畫面負責寫回。各案例 JSON 裡的
// chapter.title 已經不再使用。分兩組（2026-10-14 起）：
// - labels：首頁頂部選單用的短名（設計、模矩、構造、施工、組裝、位置，加上「活動」），只有首頁會出現
//   的章節才有（見 projects.ts 的 HOME_CHAPTER_KEYS）
// - titles：案例內頁的章節標題、獨立頁左側直書導覽、後台用的完整名稱（團隊介紹、設計概念、建築設計、
//   細部設計、結構設計、施工細節、組裝說明書、基地位置）
// 留空就用下面的預設名稱。
//
// navColor 只套用在首頁頂部選單（見 SplitExhibition.tsx 的 TopChapterNav）；留空就沿用頁面
// 本身的文字色（--foreground）。原本淺色／深色模式各一個（navColor.light／.dark），2026-10-13
// 取消深色模式後只剩一個顏色，為了相容後台已經存過的資料，仍然存在 navColor.light 這個欄位。
import chaptersData from "../../content/chapters.json";
import type { ChapterKey } from "@/lib/projects";

type LabelKey = ChapterKey | "events";

type ChapterSettings = {
  labels?: Partial<Record<LabelKey, string>>;
  titles?: Partial<Record<ChapterKey, string>>;
  navColor?: { light?: string };
};

const DEFAULT_LABELS: Record<LabelKey, string> = {
  team: "團隊",
  design: "設計",
  module: "模矩",
  structure: "構造",
  engineering: "結構",
  construction: "施工",
  assembly: "組裝",
  video: "影片",
  finished: "成品",
  site: "位置",
  events: "活動",
};

const DEFAULT_TITLES: Record<ChapterKey, string> = {
  team: "團隊介紹",
  design: "設計概念",
  module: "建築設計",
  structure: "細部設計",
  engineering: "結構設計",
  construction: "施工細節",
  assembly: "組裝說明書",
  video: "影片",
  finished: "成品照片",
  site: "基地位置",
};

const settings = chaptersData as ChapterSettings;

// 首頁頂部選單的短名
export function chapterLabel(key: LabelKey): string {
  return settings.labels?.[key]?.trim() || DEFAULT_LABELS[key];
}

// 案例內頁的完整章節名稱
export function chapterTitle(key: ChapterKey): string {
  return settings.titles?.[key]?.trim() || DEFAULT_TITLES[key];
}

// 只接受 #RGB／#RRGGBB 這類 hex 色碼，其他（後台手誤、格式不對）一律當作沒設定。
function safeColor(value?: string): string | undefined {
  const v = value?.trim();
  return v && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined;
}

export const navColor = safeColor(settings.navColor?.light);
