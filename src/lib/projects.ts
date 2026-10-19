export type ProjectImage = {
  id: string;
  caption?: string;
  tone: string;
  src?: string;
  ratio?: number; // 手動指定寬高比（width/height）——通常不用填，交錯排版演算法
  // （lib/photoLayout.ts）預設會在瀏覽器端量測真實照片的 naturalWidth/naturalHeight
  // 自動算出來；只有沒有 src 的示意色塊，或想強制覆蓋量測結果時才需要手動填這個欄位。
  kind?: "photo" | "drawing"; // 照片或圖說（首頁電腦版版型用，見 lib/photoTemplate.ts）。不填＝依圖片內容
  // 自動判斷；後台每張圖有「自動／照片／圖說」可以手動指定。
};

// （2026-10-14）章節從 6 個擴充成 8 個，固定順序如下（CHAPTER_ORDER）。key 沿用原本的英文代號，
// 現有資料不用搬；名稱改成：team 團隊介紹（新）、design 設計概念、module 建築設計、structure 細部設計、
// engineering 結構設計（新）、construction 施工細節、assembly 組裝說明書、site 基地位置（見 lib/chapters.ts）。
// 新增的 team、engineering 只出現在案例內頁，首頁的頂部選單跟照片索引不放（HOME_CHAPTER_KEYS）。
// （同日）再加一個「影片」（video）章節，放在組裝說明書之後、基地位置之前，只在案例內頁出現；影片一律放
// 這裡（chapter.videos，可以多支、各自有標題），其他章節不再有單一影片欄位。
export type ChapterKey =
  | "team"
  | "design"
  | "module"
  | "structure"
  | "engineering"
  | "construction"
  | "assembly"
  | "video"
  | "finished" // （2026-10-19）成品：首頁兩欄（施工之後、組裝之前）與案例內頁 07「成品照片」都有，還沒有照片時顯示「待補」
  | "site";

export type ChapterVideoItem = { id: string; url: string; title?: string };

// 「團隊介紹」（team）分成兩個固定單位（2026-10-14）：設計單位、業主單位，各自有文字跟圖片，存在
// chapter.units。文字照後台輸入的換行顯示、不切段落；圖片排在文字右邊（見 ProjectDetail.tsx 的
// TeamSection）。
export type TeamUnitKey = "designer" | "owner";
// name：單位名稱（例如「初樸建築師事務所」），顯示在小標「設計單位」右邊；text 是下面的介紹內文
export type TeamUnit = { key: TeamUnitKey; name?: string; text?: string; images?: ProjectImage[] };
export const TEAM_UNITS: { key: TeamUnitKey; title: string }[] = [
  { key: "designer", title: "設計單位" },
  { key: "owner", title: "業主單位" },
];

export const CHAPTER_ORDER: ChapterKey[] = [
  "team",
  "design",
  "module",
  "structure",
  "engineering",
  "construction",
  "finished", // （2026-10-19）07 成品照片
  "assembly",
  "video",
  "site",
];

export const HOME_CHAPTER_KEYS: ChapterKey[] = ["design", "module", "structure", "construction", "finished", "assembly", "site"];

// 主色（accent）同時用在「疊在封面照片上的地點／年份字」跟「白色頁面上的按鈕、導覽字」（More in Detail、
// 左側章節導覽、組裝說明書按鈕、地圖待補提示…）。後台把主色設成白色或很淺的顏色時，前者看得清楚、後者
// 會跟白底融在一起消失（2026-10-14 實際發生：兩案主色都是 #ffffff，More in Detail 按鈕整個不見）。
// 白底上的元素一律用這個函式：主色夠深就照用，太淺（亮度 > 0.6）就改用深灰。
export function accentOnLight(accent: string): string {
  const hex = accent?.trim().replace(/^#/, "");
  const full = hex?.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (!full || !/^[0-9a-fA-F]{6}$/.test(full)) return accent;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#555555" : accent;
}

// 依固定順序取出這個案例有的章節（JSON 裡的陣列順序不算數；資料裡沒有的章節就跳過）。
// keys 可以限定只取哪些章節（例如首頁只取 HOME_CHAPTER_KEYS）。
export function orderedChapters(project: Project, keys: ChapterKey[] = CHAPTER_ORDER): Chapter[] {
  // 「成品」（finished）是 2026-10-19 新增的首頁章節，舊資料還沒有這一章時補一個空的，首頁選單跟「圖片待補」照樣出現
  return keys
    .map((key) => project.chapters.find((c) => c.key === key) ?? (key === "finished" ? { key, title: "成品", images: [] } : undefined))
    .filter((c): c is Chapter => !!c);
}

export type Chapter = {
  key: ChapterKey;
  title: string; // 已不再使用——章節名稱改成兩案共用一份，見 lib/chapters.ts 的 chapterLabel()／chapterTitle()
  // （舊資料跟後台仍會寫這個欄位，留著無妨）
  text?: string; // 段落文字，用 \n\n 分段——「建築設計／模矩／構造／施工」這四章會自動排版
  // （見 lib/photoLayout.ts 的 layoutChapter），不用自己決定圖片插在哪裡；「組裝說明書」
  // 「基地」也用這個欄位，但排版方式不同（AssemblySection 只取第一段，「基地」目前沒有
  // 用到文字內容）。
  images?: ProjectImage[]; // 這章要用的照片，順序就是自動排版時的插入優先順序；首頁雙欄的
  // 照片索引（PhotoStream.tsx）也直接讀這個欄位。張數上限由 chapter.text 的字數決定（見
  // lib/photoLayout.ts 的 maxPhotosForText）——文字太少配太多圖，讀起來會像圖庫而不是有
  // 內容支撐的論述。這個欄位本身就只該放「文字撐得起」的張數，不要存超過上限：上傳流程
  // 到了上限之後，多出來的照片要放進 moreImages（MORE IN DETAIL），不是塞進這裡等著被
  // 裁掉——visibleImages() 還是會在畫面上防呆裁一次，但那是保險，不是預期的用法。
  moreImages?: ProjectImage[]; // 「MORE IN DETAIL」可展開的設計過程圖庫（手稿／模型／圖面，
  // 也是 images 超過上限時多出來的照片該去的地方），只有「建築設計／模矩／構造／施工」會
  // 用到（見 ProjectDetail.tsx 的 ReadMoreGallery）。跟 images 分開存放——這批圖只在內頁
  // 展開後才看得到，不算進首頁雙欄的照片索引。
  video?: string; // 舊欄位（已停用）：原本每個章節都能放一支影片，2026-10-14 起影片改放「影片」章節的 videos
  videos?: ChapterVideoItem[]; // 只有「影片」章節用：多支影片，各自網址（YouTube 或影片檔）＋選填標題
  pdf?: { url: string; label: string }; // 可下載檔案（目前只有「組裝說明書」會用到）
  units?: TeamUnit[]; // 只有「團隊介紹」用：設計單位、業主單位（見上方 TEAM_UNITS）
};

// 欄位對齊 Internal-Pages（as-studio001/Internal-Pages）content/projects/*.json 的 map 欄位設計，
// 同樣是 { address, lat, lng, zoom }，方便之後兩邊的內容格式互通。
export type Coordinates = { lat: number; lng: number; address?: string; zoom?: number };

// （2026-10-15）案例目標：案例內頁封面之後的第一個畫面（取代原本的目錄頁），一個畫面的篇幅。
// 左欄：標題（例如「設計目標與核心策略」）＋設計定位（一行一項）；右欄：策略小標＋策略標題＋說明＋
// 對照表＋例圖。全部選填，都沒填就不顯示這個畫面。見 ProjectDetail.tsx 的 GoalsSection。
export type ProjectGoals = {
  title?: string;
  positioningLabel?: string; // 例如「設計定位」
  positioning?: string; // 一行一項，例如「中小型\n常民化\n生活化」
  strategyLabel?: string; // 例如「策略一」
  strategyTitle?: string; // 例如「模矩化空間與應用」
  text?: string;
  tableLabel?: string; // 例如「市場對應原型」
  table?: string; // 一行一列、用 | 分欄，第一行是表頭
  images?: ProjectImage[]; // 例圖（建議 4 張，圖說顯示在圖片下方）
};

export function hasGoals(goals?: ProjectGoals): goals is ProjectGoals {
  if (!goals) return false;
  const { title, positioning, strategyTitle, text, table, images } = goals;
  return !!(title || positioning || strategyTitle || text || table || images?.some((img) => img.src));
}

export type Project = {
  slug: string;
  shortLabel: string;
  name: string;
  location: string;
  year: string;
  type: string;
  intro: string;
  accent: string;
  titleAlign?: "left" | "right"; // 封面標題／副標的水平對齊，預設 left；兩案各自獨立的視覺
  // 語言（展覽規格書「每個建築案可有自己獨立的視覺語言」），不用兩案套同一套排版。
  coverImages: ProjectImage[];
  // （2026-10-15）首頁兩欄封面要用 coverImages 裡的哪一張（存那張的 id，後台「首頁封面」單選）；
  // 沒指定、或指定的那張已經被刪掉時，沿用原本的規則用最後一張。見 homeCover()。
  homeCoverId?: string;
  // （2026-10-15）手稿：首頁策展宣言最後一屏「兩案預告」用，只取第一張有 src 的（見 CuratorialManifesto.tsx 的
  // BridgeScreen）。存成清單是為了沿用後台現成的上傳元件。
  sketchImages?: ProjectImage[];
  goals?: ProjectGoals;
  chapters: Chapter[];
  coordinates?: Coordinates; // 基地章節的地圖標記位置，待使用者提供實際地址／經緯度
  published: boolean;
};

// 案例內容從 2026-08-27 起改成讀 content/projects/<slug>.json（比照 Internal-Pages，
// as-studio001/Internal-Pages 的 content/projects/<slug>.json 同一套格式與慣例）——
// 後台（/admin，見 public/admin.html）透過共用的 Netlify Function（github-proxy）直接把
// 修改寫回這幾個 JSON 檔案本身，不是寫進另一個資料庫；前台跟這裡一樣，都是讀 repo 裡的
// 這幾個檔案，兩邊看到的內容保證一致。要新增/刪除案例，就是在 content/projects/ 底下
// 新增/刪除一個 <slug>.json 檔案並加進（或移出）下面這個 import 清單——這份清單本身還是
// 純手動維護（跟 Internal-Pages 用 GitHub API 的 listDir 動態列目錄不同，Next.js 的
// import 在建置當下就要能靜態解析到實際檔案，沒辦法用執行期才知道的檔名去動態 import）。
//
// 色彩方向：整體走黑白＋照片原色（參考 Meili Vogt Conzett 的中性感），accent 是單一螢光綠
// （參考 Liquid Architecture 網站），只用在少數裝飾細節（「+」號、連結、標籤文字），不當滿版底色。
// A、B 兩案共用同一組螢光綠，不再分深淺——兩案的分界已經靠各自獨立捲動來呈現，顏色不需要再擔這個責任。
//
// 章節架構（2026-08-14 定案）：建築設計／模矩／構造／施工／組裝說明書／基地，共六類，
// 每一章節都可以放影片（chapter.video，比照片小、左右留白、可全螢幕），
// 組裝說明書額外可放 PDF 下載（chapter.pdf），基地章節額外顯示地圖（project.coordinates）。
//
// 首頁／內頁分工（2026-08-19 定案，2026-08-26 修正圖片來源）：首頁雙欄顯示封面＋照片索引
// ＋基地地圖；六個章節的完整文字改到 /projects/[slug] 案例內頁展開——「建築設計」是內頁主要
// 論述，「模矩／構造／施工／組裝說明書」是內頁的 more-in-detail 子章節，「基地」在內頁也會
// 再顯示一次地圖（跟首頁那份各自獨立掛載）。
//
// 首頁的照片索引不再是獨立的 project.photos 扁平清單，改成**直接借用每個章節自己的
// chapter.images**——這樣每張照片天生就知道自己屬於哪個章節，首頁頂部的章節標籤才能準確
// 捲到對應的照片群組（同一個 id={`${slug}-${key}`} 錨點，首頁跟內頁共用同一套章節 key）。
import projectOneData from "../../content/projects/project-one.json";
import projectTwoData from "../../content/projects/project-two.json";

export const projects: Project[] = [projectOneData, projectTwoData] as Project[];

export function getPublishedProjects(): Project[] {
  return projects.filter((p) => p.published);
}

// 首頁兩欄的封面照片（也是案例內頁封面輪播一開始顯示的那張——兩邊同一個 layoutId，從首頁點進來的
// 放大轉場才接得上）：後台指定的 homeCoverId，沒有就用最後一張有圖的。
export function homeCover(project: Project): ProjectImage | undefined {
  const withSrc = project.coverImages.filter((img) => img.src);
  return (
    withSrc.find((img) => img.id === project.homeCoverId) ?? withSrc[withSrc.length - 1] ?? project.coverImages[0]
  );
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
