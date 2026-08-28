@AGENTS.md

# 專案說明（給 Claude Code／未來協作者讀取）

本檔案是這個 repo 的持續性背景資料，取代反覆口頭說明。完整原始規格見 [展覽網站規格書.md](展覽網站規格書.md)，以下是目前為止最完整、最新的執行狀態摘要——**這份文件本身就是給「新接手的 AI 或同事」看的交接備忘錄**，新加入的人應該從頭讀到尾，不用再回去翻對話紀錄。

## 專案是什麼

一個**展覽**的線上呈現，展出兩棟建築案（常民竹小屋、一籌），調性是策展／展覽感（參考 [朋丁 pon ding](https://www.ponding.tw/) 的精神，非逐一複製版型），不是建築師事務所作品集。重點：

- 首頁先進「策展宣言」滿版畫面，向下捲動才進到兩棟建築案左右並列的兩欄展覽，不做分類／篩選／中介層
- 每個建築案可有自己獨立的視覺語言，不必套同一套模板（例如「一籌」標題靠右，`titleAlign: "right"`）
- 無卡片框線、無明顯網格，圖文並置的編輯雜誌感，非對稱排列
- 微妙互動（hover 底線展開、圖片輕微縮放 scale ~1.02），克制、不花俏
- 上下架、內容全部能透過後台（`/admin`）自行調整，不需要每次改動都動程式碼、也不需要重新部署

## 技術架構

| 項目 | 選擇 |
|---|---|
| 前端框架 | Next.js 16（App Router, TypeScript），React 19 |
| 樣式 | Tailwind CSS v4 |
| 動畫 | Framer Motion（`^13`） |
| PDF 翻頁 | pdfjs-dist + react-pageflip（見「組裝說明書」章節） |
| 地圖 | leaflet（「基地」章節） |
| 部署 | Vercel（`https://bamboo-sage.vercel.app/`），push 到 `main` 自動部署 |
| 內容存放 | **git-based CMS**：`content/projects/<slug>.json`（不是資料庫），前台建置時直接 `import` 這兩個 JSON 檔 |
| 後台驗證 | Supabase Auth——**跟 as-studio001/Internal-Pages 共用同一個 Supabase 專案／同一批登入使用者**，這個專案自己沒有申請新的 Supabase 帳號 |
| 後台寫回機制 | `/admin`（`public/admin.html`）登入後，存檔會呼叫共用的 Netlify Function（`github-proxy`，架在 as-studio001/Internal-Pages 那個 repo 的 `netlify/functions/`）直接把 `content/projects/<slug>.json` 寫回**這個 repo**（bamboo），不是寫進資料庫 |
| 圖片／影片存放 | `public/images/`、`public/files/`（本機檔案系統，透過 github-proxy 的 GitHub Contents API／Git Data API 寫入，不是 Supabase Storage／Cloudinary） |

**這個架構最不直覺的一點**：bamboo 這個網站本身沒有自己的後端／資料庫／認證系統——它的「後台」完全寄生在 as-studio001/Internal-Pages 那個姊妹專案已經架好的 Supabase＋Netlify Functions 上，只是把寫入目標 repo 從 `Internal-Pages` 換成 `bamboo`（見下面「後台架構」一節的白名單機制）。

## 兩個 repo 的關係（重要，第一次接手一定要搞懂）

- **`as-studio001/bamboo`**（這個 repo）——展覽網站本身，Vercel 部署
- **`as-studio001/Internal-Pages`**——另一個團隊（原型建築 / AS. studio arch）自己的網站＋後台，GitHub Pages 部署（`https://as-studio001.github.io/Internal-Pages/`），**同時也是這個專案共用後端的所在地**：
  - `netlify/functions/github-proxy.js`（連同 `_shared.js`／`invite-user.js`／`list-users.js`／`remove-user.js`）架在這個 repo，部署到 Netlify 站 `zingy-bonbon-36e6c9.netlify.app`（**不是** `glittering-dodol-8e2041`，那是一個已經沒人維護的舊站，Netlify 帳號底下容易選錯，見下面「踩過的坑」）
  - `github-proxy.js` 裡的 `ALLOWED_REPOS` 白名單（目前是 `["Internal-Pages", "asstudiowebsite", "bamboo"]`）決定這支 Function 願意幫哪些 repo 寫檔案——bamboo 能運作全靠這裡有 `"bamboo"`，改動這個白名單等於改動一支正在給 Internal-Pages 真實使用者用的 production 檔案，要謹慎
  - 它的 `js/render.js`（前台自動排版演算法）跟 `admin/index.html`（後台介面）是這個專案**照抄／移植的原始參考來源**，不是憑空設計的，見下面「圖文自動排版演算法」與「後台架構」兩節
- 兩邊後台（bamboo 的 `/admin` 跟 Internal-Pages 自己的 `admin/index.html`）互相在頂列加了對方的連結，並且做了「登入交接」（點連結會把目前的 Supabase session 用網址 hash 帶過去，對面直接套用，不用重新登入），細節見下面

## 頁面架構

1. **展覽首頁 `/`** — 現在是**兩個滿版畫面疊起來、用整頁 `scroll-snap` 切換**（2026-08-28 新增）：
   - 第一畫面：**策展宣言**（`CuratorialManifesto.tsx`）——純文字、非對稱靠左，不用任何一案的照片當背景（避免偏袒觀感），底部有捲動提示
   - 第二畫面：**兩欄展覽**（`SplitExhibition.tsx`）——兩棟建築案左右並列，各自獨立的封面／照片索引／基地地圖，滑鼠滾輪在欄位內是自訂的慣性捲動物理（`usePanelWheelScroll`），跟整頁的 scroll-snap 是兩層獨立的捲動範圍（欄位內的 wheel handler 會 `preventDefault()`，不會漏出去影響整頁捲動）
2. **建築案內頁** — 兩種進入方式共用同一套內容元件（`ProjectDetail.tsx`）：
   - `/projects/[slug]` 獨立頁面（分享連結／SEO 用，自己畫左側章節導覽 `ChapterEdgeNav`）
   - 從首頁點照片進來的**彈出視窗**（Parallel + Intercepting Routes：`@modal/(.)projects/[slug]/page.tsx`，`DetailModal.tsx` 包一層液態玻璃質感的殼），首頁在背後維持掛載、章節標籤列共用首頁那份 `TopChapterNav`，不重複做
   - 內頁結構：大圖 hero → 建築設計（主要論述）→ 模矩／構造／施工（子章節，圖文自動排版，見下一節）→ 組裝說明書（PDF 翻頁書，`AssemblyBook.tsx` + `PdfFlipbook.tsx`）→ 基地（地圖，`ChapterMap`）
   - 首頁的照片索引（`PhotoStream.tsx`）跟內頁同一張照片用同一個 `layoutId`，點擊會有 shared element 放大轉場銜接過去
3. **後台管理 `/admin`（需登入）** — 見「後台架構」一節

## 資料模型與內容存放

型別定義在 [src/lib/projects.ts](src/lib/projects.ts)：

```ts
ProjectImage = { id, caption?, tone, src?, ratio? }
Chapter = { key, title, text?, images?, moreImages?, video?, pdf? }
ChapterKey = "design" | "module" | "structure" | "construction" | "assembly" | "site"
Project = { slug, shortLabel, name, location, year, type, intro, accent, titleAlign?,
            coverImages, chapters, coordinates?, published }
```

實際內容存在 **[content/projects/project-one.json](content/projects/project-one.json)** 跟 **[content/projects/project-two.json](content/projects/project-two.json)**（不是寫死在 `.ts` 檔案裡）。`projects.ts` 只是 `import` 這兩個 JSON 檔組成 `projects` 陣列，再匯出 `getPublishedProjects()`／`getProjectBySlug()`。

**要新增第三個案例**：在 `content/projects/` 底下新增一個 `<slug>.json`（後台目前也能做這件事，見下一節），**同時**要手動把它加進 `projects.ts` 最上面的 `import` 清單——這份清單本身是純手動維護的（Next.js 的 `import` 在建置當下就要能靜態解析到實際檔案，沒辦法像 Internal-Pages 那樣用 GitHub API 動態 `listDir` 決定要 import 誰）。**如果後台新增了案例但忘記加這一行 import，前台不會顯示新案例**，這是目前架構唯一需要手動同步的地方。

## 圖文自動排版演算法（`lib/photoLayout.ts`）

「建築設計／模矩／構造／施工」四個章節的圖文交錯排版是**完全自動的**，不是手動排的，也不是隨機的——直接照抄 Internal-Pages 的 `js/render.js`（`makePhotoChunks()`／`renderContent()`），根據每張照片**真實的寬高比**決定要單張大圖、還是兩張不對稱並排：

- 量測比例：`usePhotosWithRatio.ts` 在瀏覽器端用 `naturalWidth/naturalHeight` 量測（不用使用者手動填比例）
- 分類：`ratio < 0.85` 直幅、`> 1.9` 全景、`> 1.15` 橫幅、其餘方形
- 分組上限**最多 2 張**一組（不是 3 張——三張混合方向並排時欄寬換算到實際版面常留下不成比例的空白，2026-08-28 從源頭排除）：連續 2 張直幅等寬並排、2 張橫幅用 `[7,4]/[4,7]/[6,5]` 三種寬窄比例輪替（整個案例頁共用一份 `RatioState`，輪替節奏跨章節接續）、全景照獨立佔整排、落單一張只在鄰居也是單張時才併成一組
- 兩張並排的照片各自維持真實比例、高度不強制拉伸一致，用 `align-items: end`（底部切齊）避免留白；連續兩排照片中間沒文字隔開時會**交替**底部／頂部切齊，讓留白被推到最外側（`applyRowAlignment()`）
- 段落插入位置用最單純的等分公式（`Math.round(((i+1)*段落數)/(圖片組數+1))`），**不加隨機抖動**——「篇章差異、有呼吸感」的來源是每章圖片形狀跟張數本身不同，不是刻意加的隨機數字（這是繞了一大圈才確認的結論：先做過「章節 key 當種子的隨機排版」被使用者否決，才回頭直接讀 Internal-Pages 真正的原始碼移植過來）

**照片張數上限跟文字份量掛鉤**（`maxPhotosForText()`，使用者訂的規則，2026-08-28 校準過一次）：前 300 字給 2 張，之後每多滿 **100 字**再加 1 張。校準基準是 Internal-Pages 真實案例「老古石芳宅」的密度（約 1800 字配 7 張照片）。`chapter.images` 陣列本身就只該放「文字撐得起」的張數，超過上限的照片要直接放進 `chapter.moreImages`（MORE IN DETAIL 收合圖庫），不是塞進 `images` 等著被畫面裁掉——`visibleImages()` 的裁切是最後一道防呆，不是預期的用法。

## 後台架構（`public/admin.html`）

純 HTML/JS 單頁 app（比照 Internal-Pages 的 `admin/index.html`，同一套視覺語言跟技術模式），透過 `next.config.ts` 的 `rewrite` 讓 `/admin` 這個路徑直接回傳這個靜態檔案（不是 App Router 頁面）。

**登入**：Supabase email/密碼登入。`SUPABASE_URL`／`SUPABASE_ANON_KEY`／`FUNCTIONS_BASE` 三個常數直接沿用 Internal-Pages 線上真正在用的值（anon key 本來就設計成可以放前端，不是密鑰）。**沒有自己的「使用者管理」介面**——要邀請新人，去 Internal-Pages 的後台「使用者管理」分頁寄邀請信，兩邊是同一批使用者。

**寫回機制**：`ghGetFile`／`ghListDir`（讀，先試 GitHub 公開 API 直接讀，失敗才 fallback 到 `github-proxy`）、`ghPutFile`／`ghDeleteFile`／`uploadAsset`（寫，一定要透過 `github-proxy`，因為要用藏在 Netlify 環境變數裡的服務帳號 `GITHUB_TOKEN`）。每個呼叫都明確帶 `repo: "bamboo"`。

**涵蓋範圍**：案例列表（上架狀態一覽、新增／刪除案例）＋案例編輯器（基本資料、封面照片、六個固定章節的文字／照片／MORE IN DETAIL／PDF／影片／基地座標——基地座標欄位直接嵌在「基地」章節區塊裡，不是放在最上面）。圖片／GIF／影片上傳都支援（依副檔名判斷用 `<img>` 還是 `<video>` 預覽）。

**跨後台登入交接**：頂列各有一個連結可以切到對面的後台（bamboo → 原型建築後台、原型建築 → bamboo 後台）。點連結時 `crossAdminUrl()` 會把目前手上的 Supabase session（access token／refresh token）用網址 hash（`#handoff_at=...&handoff_rt=...`）帶過去，對面偵測到就直接 `setSession()` 換上，不用重新輸入帳密——效果是「同一次登入兩邊直接通用」。做法沿用 Supabase 自己邀請信／忘記密碼連結本來就在用的「hash 帶 token」模式。接收端讀完立刻清掉 hash，不留在網址列／瀏覽紀錄裡；帶過去的 token 失效就正常退回登入畫面。**這個機制兩邊（bamboo 的 `public/admin.html`、Internal-Pages 的 `admin/index.html`）都要同步維護，改一邊要記得改另一邊。**

## 動效原則

進場淡入位移（20px / 0.6–0.8s）、案例照片頁面轉場用 shared element transition（`layoutId` + `SHARED_ELEMENT_TRANSITION`，見 `theme.ts`：`duration:0.7, ease:[0.22,1,0.36,1]`，圖片放大銜接下一頁）、hover 細節克制（底線展開、scale~1.02）、視差捲動用量節制。

## 已知的坑／眉角（下次遇到類似狀況先看這裡，不要重踩）

- **Netlify 部署會「安靜跳過」**：Internal-Pages 那個 Netlify 站的 `netlify.toml` 有一條 `ignore` 規則，只有真的改到 `netlify.toml` 或 `netlify/` 資料夾（Function 原始碼）才會觸發重新部署，其他 commit（包括後台存檔產生的內容 commit）一律跳過，避免每次存檔都白白重新部署燒 credits。**如果改了 `github-proxy.js` 之後 bamboo 後台還是回「repo not allowed」，先確認 Netlify 帳號的月額度沒有用完**（2026-08-25、2026-08-28 都發生過帳號額度燒光導致部署被跳過的狀況，症狀是 Deploys 頁面寫「Skipped due to account credit usage exceeded」，不是程式碼問題）；也要確認看的是正確的 Netlify 專案（`zingy-bonbon-36e6c9`，不是 `glittering-dodol-8e2041` 那個舊站）。
- **GitHub 公開 API 有速率限制**：`ghFetchPublic` 的 fallback 邏輯依賴這個，未登入的請求每小時只有 60 次，密集測試（尤其是同一個 IP／同一台開發機）很容易撞到 `403 rate limit exceeded`，跟「repo not allowed」是完全不同的錯誤，不要搞混。
- **pdf.js `page.render()` 不能同時傳 `canvasContext` 跟 `canvas`**：`pdfjs-dist` v6 這樣傳會整個 hang 住、不會報錯，只能傳 `canvas`（見 `lib/pdfPages.ts`）。
- **這個 sandbox 環境（開發測試用）的 `requestAnimationFrame` 在 Browser 分頁沒有實際顯示時會凍結**，導致 Framer Motion 的 shared element 轉場動畫在這裡測試不出來——這不是產品本身的 bug，機制本身是對的（用 computed style 檢查過 FLIP transform 有正確算出來），只是這個沙盒的限制，不用又花時間重查。
- **內文照片一律用「原生比例」顯示，不是裁切滿版**：`ImagePlaceholder.tsx` 的 `natural` 模式用原生 `<img>`（不是 `next/image` 的 `fill`），寬度照 grid 的 fr 權重分配、高度依真實比例自動算——這是圖文自動排版演算法「主次關係」看得出來的關鍵，不要為了統一視覺又改回固定框裁切。
- **`next.config.ts` 的 `rewrites()` 把 `/admin` 導去 `public/admin.html`**——這是一支完全獨立的靜態 HTML app，不受 Next.js App Router／React 影響，改後台要直接改這個檔案，不是去 `src/app/admin/`（那個 React 版本的舊後台已經刪掉了）。

## 目前內容狀態（哪些是真的、哪些是佔位）

- **project-one（常民竹小屋）**：10 張真實工地現場照片（`public/images/project-one/`），已分散用在各章節；`intro`／各章節 `text` 都還是「〔佔位文字，抓版面用〕」開頭的草稿；`location`／`year`／`type` 都是「待補」；`coordinates` 還沒有值
- **project-two（一籌）**：只有 1 張真實照片（封面），其餘照片全部是從 picsum.photos 下載的免版權風景照（`public/images/stock/`，已存進專案不是外連），標「〔網路免版權風景照，待替換〕」；其餘欄位狀態同 project-one
- **首頁「策展宣言」文字**：全新的佔位文字，還沒有正式策展論述
- **組裝說明書 PDF**：兩案都是同一份範例檔案（`public/files/project-*/assembly.pdf`），不是正式內容
- **這些全部都可以直接用 `/admin` 後台編輯，不需要改程式碼、不需要重新部署**——這是這整套架構存在的目的

## 目前狀態 / 待辦

- [x] Next.js + TypeScript + Tailwind 專案骨架、Vercel 部署
- [x] 首頁（策展宣言 + 兩欄展覽）、建築案內頁（獨立頁面 + 彈出視窗兩種進入方式）
- [x] 案例照片 shared element 轉場、組裝說明書 PDF 翻頁書
- [x] 圖文自動排版演算法（照抄 Internal-Pages，形狀／大小決定主次，張數跟文字份量掛鉤）
- [x] 正式後台 `/admin`（跟 Internal-Pages 共用 Supabase／Netlify 後端，git-JSON 存儲，跨後台登入交接）
- [ ] **實際建築案圖片與文字內容**——目前大多還是佔位文字／免版權風景照，需要真實案名、地點、年份、論述、正式照片跟正式組裝說明書 PDF，直接用 `/admin` 後台編輯即可
- [ ] 首頁「策展宣言」正式文案
- [ ] 「新增案例」在後台操作後，`src/lib/projects.ts` 頂端的 import 清單需要手動補一行（見「資料模型」一節）——這步驟目前沒有自動化，如果之後要支援後台自己新增案例並且前台自動生效，這是需要再處理的地方

## 開發指令

```bash
npm run dev    # 本機開發（含 Fast Refresh）
npm run build  # 正式建置，驗證型別與 lint
```

啟動 `npm run dev` 前注意：這台機器的系統 PATH 是在安裝 Node.js「之後」才更新，若某個終端機階段開啟得比安裝早，`node`/`npm` 可能抓不到，開新的終端機視窗即可。

`/admin` 本機測試：`npm run dev` 之後直接訪問 `http://localhost:3000/admin`，會走真正的 Supabase／Netlify 後端（不是 mock），登入跟存檔都是對 production 資源操作，測試時要注意。

## 給未來的我（或其他協作者）的提醒

- 規格書明確說「不需要重新定義整體架構」，未涵蓋細節（色票、字體、作品數量）可直接在對話中補齊，不用重新問一輪大架構問題
- 字體、色彩、版面比例這類「精細質感」執行細節本來就留給實作階段自由發揮，不必等規格書明確指定才動工
- **這個專案有一個姊妹 repo（as-studio001/Internal-Pages）共用後端跟參考演算法**——遇到「後台為什麼這樣設計」「排版演算法為什麼這樣算」這類問題，先去讀那個 repo 的實際原始碼（`admin/index.html`、`js/render.js`、`netlify/functions/`），不要憑空猜測或重新發明，使用者好幾次都是直接要求「去看它的原始程式碼」而不是「參考它的感覺」
- 改動 `github-proxy.js`／`netlify.toml` 這類 Internal-Pages 的共用後端檔案時，要記得那是**別人正在用的 production 系統**，改完要 push、也要提醒使用者確認 Netlify 那邊的部署狀態，不能假設「push 了就一定生效」
