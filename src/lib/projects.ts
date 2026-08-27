export type ProjectImage = {
  id: string;
  caption?: string;
  tone: string;
  src?: string;
  ratio?: number; // 手動指定寬高比（width/height）——通常不用填，交錯排版演算法
  // （lib/photoLayout.ts）預設會在瀏覽器端量測真實照片的 naturalWidth/naturalHeight
  // 自動算出來；只有沒有 src 的示意色塊，或想強制覆蓋量測結果時才需要手動填這個欄位。
};

export type ChapterKey = "design" | "module" | "structure" | "construction" | "assembly" | "site";

export type Chapter = {
  key: ChapterKey;
  title: string;
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
  video?: string; // 影片路徑（可選，每個章節都能放）
  pdf?: { url: string; label: string }; // 可下載檔案（目前只有「組裝說明書」會用到）
};

// 欄位對齊 Internal-Pages（as-studio001/Internal-Pages）content/projects/*.json 的 map 欄位設計，
// 同樣是 { address, lat, lng, zoom }，方便之後兩邊的內容格式互通。
export type Coordinates = { lat: number; lng: number; address?: string; zoom?: number };

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

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
