@AGENTS.md

# 專案說明（給 Claude Code 讀取）

本檔案是這個 repo 的持續性背景資料，取代反覆口頭說明。完整原始規格見 [展覽網站規格書.md](展覽網站規格書.md)，以下是摘要與目前執行狀態。

## 專案是什麼

一個**展覽**的線上呈現，展出兩棟建築案，調性是策展／展覽感（參考 [朋丁 pon ding](https://www.ponding.tw/) 的精神，非逐一複製版型），不是建築師事務所作品集。重點：

- 首頁直接完整並列呈現兩棟建築案，不做分類／篩選／中介層
- 每個建築案可有自己獨立的視覺語言，不必套同一套模板
- 無卡片框線、無明顯網格，圖文並置的編輯雜誌感，非對稱排列
- 微妙互動（hover 底線展開、圖片輕微縮放 scale ~1.02），克制、不花俏
- 上下架、配色、排版設定要能透過後台自行調整，不需要每次改動都動程式碼

## 技術架構

| 項目 | 選擇 |
|---|---|
| 前端框架 | Next.js（App Router, TypeScript） |
| 樣式 | Tailwind CSS |
| 資料庫／後台驗證 | Supabase Auth（2026-08-27 起：跟 as-studio001/Internal-Pages 共用同一個 Supabase 專案／同一批登入使用者，不是這個專案自己申請的） |
| 部署 | Vercel（`https://bamboo-sage.vercel.app/`，push 到 main 自動部署） |
| 後台寫回機制 | 內容存成 `content/projects/<slug>.json`，`/admin`（`public/admin.html`）登入後透過共用的 Netlify Function（`github-proxy`，架在 as-studio001/Internal-Pages 那個 repo）直接寫回這個 repo，不是存進資料庫 |
| 圖片存放 | `public/images/`（本機檔案系統，透過上面的 github-proxy 寫入，不是 Supabase Storage／Cloudinary） |
| 動畫 | Framer Motion |

## 頁面架構

1. **展覽首頁 `/`** — 極簡導覽列，下方兩棟建築案左右並行完整呈現，各自獨立圖文編排，不做 Hero、不強調日期
2. **建築案頁 `/projects/[slug]`** × 2 — 大尺寸圖像（可多張全螢幕捲動）、名稱／地點／年份／類型、論述文字、圖說
3. **關於／展覽介紹** — 整合進頁尾或極簡單一區塊，不獨立成頁
4. **後台管理 `/admin`（需登入）** — 純 HTML/JS 單頁 app（`public/admin.html`，跟 as-studio001/Internal-Pages 的 admin/index.html 同一套架構與視覺語言，經 `next.config.ts` 的 rewrite 對應到這個路徑），Supabase Auth 登入、編輯兩個案例的所有欄位（基本資料、封面照片、六個章節的文字／照片／PDF／基地座標）、上下架切換，存檔會直接把 `content/projects/<slug>.json` 寫回這個 repo（透過共用的 github-proxy Netlify Function）

## 動效原則

進場淡入位移（20px / 0.6–0.8s）、頁面轉場用 shared element transition（圖片放大銜接下一頁）、hover 細節克制、視差捲動用量節制。

## 目前狀態 / 待辦

- [x] Node.js 環境安裝完成
- [x] Next.js + TypeScript + Tailwind 專案骨架
- [x] 首頁（`src/app/(site)/page.tsx`）、建築案頁（`src/app/(site)/projects/[slug]/page.tsx`）——`npm run build` 已驗證通過
- [x] Vercel 部署（`https://bamboo-sage.vercel.app/`）
- [x] 後台（`/admin`）串接 Supabase Auth＋GitHub 寫回（2026-08-27）：內容從 `src/lib/projects.ts` 的假資料陣列改成讀 `content/projects/<slug>.json`；後台跟 as-studio001/Internal-Pages 共用同一個 Supabase 專案（同一批登入使用者）跟同一支 Netlify Function（`github-proxy`，已把 `bamboo` 加進它的 ALLOWED_REPOS 白名單），登入後編輯內容、存檔會直接 commit 回這個 repo；`src/lib/projects.ts` 保留 `ProjectImage`／`Chapter`／`Project` 型別定義跟 `getPublishedProjects`／`getProjectBySlug`，只是資料來源換成 `import` 這兩個 JSON 檔
- [ ] 實際建築案圖片與文字內容（目前 `content/projects/*.json` 大多還是「待補」佔位文字、部分照片是網路免版權風景照，需替換成真實案名、地點、年份、論述與圖片——可以直接用 `/admin` 後台編輯，不用改程式碼）

## 開發指令

```bash
npm run dev    # 本機開發（含 Fast Refresh）
npm run build  # 正式建置，驗證型別與 lint
```

啟動 `npm run dev` 前注意：這台機器的系統 PATH 是在安裝 Node.js「之後」才更新，若某個終端機階段開啟得比安裝早，`node`/`npm` 可能抓不到，開新的終端機視窗即可。

## 給未來的我（或其他協作者）的提醒

- 規格書明確說「不需要重新定義整體架構」，未涵蓋細節（色票、字體、作品數量）可直接在對話中補齊，不用重新問一輪大架構問題
- 字體、色彩、版面比例這類「精細質感」執行細節本來就留給實作階段自由發揮，不必等規格書明確指定才動工
