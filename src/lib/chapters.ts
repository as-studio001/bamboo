// 章節名稱（建築設計／模矩／構造／施工／組裝說明書／基地，加上「活動」）是兩個案例共用的一份，
// 跟「活動」「策展宣言」一樣走 git-based CMS：存在 content/chapters.json，後台 /admin 的
// 「章節標題」編輯畫面負責寫回。首頁頂部選單、案例內頁的章節小標、獨立頁左側直書導覽、
// 活動區塊的標題，讀的都是這一份——各案例 JSON 裡的 chapter.title 已經不再使用。
//
// navColor 只套用在首頁頂部選單（見 SplitExhibition.tsx 的 TopChapterNav），淺色／深色模式
// 各一個；留空就沿用主題本身的文字色（--foreground）。
import chaptersData from "../../content/chapters.json";
import type { ChapterKey } from "@/lib/projects";

type LabelKey = ChapterKey | "events";

type ChapterSettings = {
  labels?: Partial<Record<LabelKey, string>>;
  navColor?: { light?: string; dark?: string };
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

// 顏色值會直接寫進 <style>，只接受 #RGB／#RRGGBB 這類 hex 色碼，其他一律當作沒設定。
function safeColor(value?: string): string | undefined {
  const v = value?.trim();
  return v && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined;
}

export const navColor = {
  light: safeColor(settings.navColor?.light),
  dark: safeColor(settings.navColor?.dark),
};
