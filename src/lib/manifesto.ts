// 「策展宣言」是整個展覽共用的一份文字（不屬於任何一個建築案），跟「活動」一樣走 git-based CMS：
// 存在 content/manifesto.json，前台建置時直接 import；後台 /admin 的「策展宣言」編輯畫面負責
// 寫回這個檔案。
//
// （2026-10-15）從單一畫面改成五個連續畫面（見 CuratorialManifesto.tsx），內容整理自策展簡報：
// 封面 → 一句話主張（NOT／NOT／BUT）→ A＋B＝？ → 數字與竹構生成鏈 → 系統提供可能，業主決定結果。
// 每一屏一個物件；文字欄位裡的換行前台會原樣保留，留空的欄位前台就不顯示那一塊。
import manifestoData from "../../content/manifesto.json";

export type ManifestoCover = {
  label?: string; // 底部頁碼旁的英文小字
  title?: string; // 大標，例如「常民竹小屋實驗計畫」
  subtitle?: string; // 英文副標
  tagline?: string; // 一句話
  credit?: string; // 策展人
  notes?: string; // 灰色補充（實驗場域、展示軸線…），可換行
  image?: string; // （2026-10-16）第一屏滿版背景照片，留空＝紙張底
  // （2026-10-16）第一屏滿版「淺色」背景圖（例如霧中竹影插畫）：不加深色遮罩、文字維持深色，左側再疊一層
  // 由紙色漸透明的薄霧確保字清楚；有這張時不顯示右下角主視覺（figure）。跟 image 二擇一，image 優先。
  backdrop?: string;
  figure?: string; // （2026-10-16）第一屏右下角的主視覺（去背 PNG，例如海報裡的竹剖面），貼齊畫面右緣；有滿版照片時不顯示
};

export type ManifestoStatement = {
  label?: string;
  title?: string; // 主張大字，可換行
  body?: string;
  contrasts?: { label: string; text: string }[]; // 不只是／不只是／而是（原 NOT／NOT／BUT），最後一格是答案（竹棕色強調）
  en?: string; // （2026-10-19）主張句的英文，顯示在主張句下方
};

export type ManifestoFormula = {
  label?: string;
  terms?: { symbol: string; title: string; subtitle?: string; en?: string }[]; // A、B、?，最後一個是結果
  note?: string;
};

export type ManifestoCounts = {
  label?: string;
  title?: string;
  body?: string;
  items?: { value: string; label: string; en?: string }[];
  chainLabel?: string;
  chain?: string[]; // 竹構生成鏈的步驟
};

export type ManifestoClosing = {
  label?: string;
  title?: string; // 第一行（小）
  emphasis?: string; // 第二行（大）
  from?: string;
  to?: string;
  shiftBody?: string;
  variables?: string; // 一行一個
  variablesBody?: string;
};

// （2026-10-15）第六屏「兩案預告」：接在結語之後、兩欄展覽之前，當作理念到作品的過渡。
// 上半部是原本單頁宣言的三個面向＋引言，下半部左右對分（對齊下面的兩欄展覽）放兩案的手稿
// （各案後台的 sketchImages）、案名、資訊與一句簡介（intros，依案例 slug 存）。
export type ManifestoBridge = {
  label?: string;
  title?: string;
  points?: string; // 一行一個面向
  quote?: string;
  divider?: string; // 分隔線中間的小字，例如「兩組實驗場域」
  intros?: Record<string, string>; // 各案一句簡介，key 是案例 slug
  // （2026-10-16）第二屏「為什麼要做竹小屋」四格（關鍵字＋一句說明），放在三個面向與公式之間
  reasonsLabel?: string;
  reasons?: { title: string; text: string }[];
  cta?: string; // 兩案下方的按鈕文字，點了捲到兩欄展覽（例如「看兩個案子」）
};

export type Manifesto = {
  eyebrow?: string; // 第一屏最上面的小字（等寬字、灰色）
  cover?: ManifestoCover;
  statement?: ManifestoStatement;
  formula?: ManifestoFormula;
  counts?: ManifestoCounts;
  closing?: ManifestoClosing;
  bridge?: ManifestoBridge;
};

export const manifesto: Manifesto = manifestoData as Manifesto;
