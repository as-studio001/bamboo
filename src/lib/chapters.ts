// 章節名稱（建築設計／模矩／構造／施工／組裝說明書／基地，加上「活動」）是兩個案例共用的一份，
// 跟「活動」「策展宣言」一樣走 git-based CMS：存在 content/chapters.json，後台 /admin 的
// 「章節標題」編輯畫面負責寫回。首頁頂部選單、案例內頁的章節小標、獨立頁左側直書導覽、
// 活動區塊的標題，讀的都是這一份——各案例 JSON 裡的 chapter.title 已經不再使用。
//
// navColor 只套用在首頁頂部選單（見 SplitExhibition.tsx 的 TopChapterNav）；留空就沿用頁面
// 本身的文字色（--foreground）。原本淺色／深色模式各一個（navColor.light／.dark），2026-10-13
// 取消深色模式後只剩一個顏色，為了相容後台已經存過的資料，仍然存在 navColor.light 這個欄位。
import chaptersData from "../../content/chapters.json";
import type { ChapterKey } from "@/lib/projects";

type LabelKey = ChapterKey | "events";

type ChapterSettings = {
  labels?: Partial<Record<LabelKey, string>>;
  navColor?: { light?: string };
};

const DEFAULT_LABELS: Record<LabelKey, string> = {
  design: "建築設計",
  module: "模矩",
  structure: "構造",
  construction: "施工",
  assembly: "組裝說明書",
  site: "基地",
  events: "活動",
};

const settings = chaptersData as ChapterSettings;

export function chapterLabel(key: LabelKey): string {
  return settings.labels?.[key]?.trim() || DEFAULT_LABELS[key];
}

// 只接受 #RGB／#RRGGBB 這類 hex 色碼，其他（後台手誤、格式不對）一律當作沒設定。
function safeColor(value?: string): string | undefined {
  const v = value?.trim();
  return v && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined;
}

export const navColor = safeColor(settings.navColor?.light);
