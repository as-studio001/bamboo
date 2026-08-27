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
  // 照片索引（PhotoStream.tsx）也直接讀這個欄位。實際會顯示幾張不是看陣列長度，是看
  // chapter.text 的字數（見 lib/photoLayout.ts 的 maxPhotosForText／visibleImages）——
  // 文字太少配太多圖，讀起來會像圖庫而不是有內容支撐的論述，所以這裡允許存得比上限多
  // （之後文字寫長了，多出來的照片會自動開始顯示，不用重新上傳），畫面上一律自動裁到
  // 文字份量撐得起的張數。
  moreImages?: ProjectImage[]; // 「MORE IN DETAIL」可展開的設計過程圖庫（手稿／模型／圖面），
  // 只有「建築設計／模矩／構造／施工」會用到（見 ProjectDetail.tsx 的 ReadMoreGallery）。
  // 跟 images 分開存放——這批圖只在內頁展開後才看得到，不算進首頁雙欄的照片索引。
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

// 佔位資料 — 實際案名、地點、年份、色票、論述文字與圖片待補，
// 未來由後台（Supabase）管理，前台僅讀取 published === true 的項目。
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
export const projects: Project[] = [
  {
    slug: "project-one",
    shortLabel: "作品 A",
    name: "常民竹小屋",
    location: "地點待補",
    year: "年份待補",
    type: "類型待補",
    intro: "〔佔位文字，約150字，抓版面用〕常民竹小屋回應的是常民生活與竹材構造之間的關係——如何用最普及、最貼近土地的材料，搭建出屬於日常使用的輕構造空間。這裡作為整體概述，說明設計思考、構造邏輯與施工方式的整體脈絡，細節則留待後面各章節逐一展開，之後會替換成正式的策展論述文字。",
    accent: "#39FF14",
    coverImages: [
      { id: "a-cover-2", tone: "bg-neutral-300", caption: "封面 02", src: "/images/project-one/1786700848131-_______2026-08-14_173851.png" },
      { id: "a-cover-3", tone: "bg-neutral-300", caption: "封面 03", src: "/images/project-one/1786700851881-_______2026-08-14_173939.png" },
      { id: "a-cover-4", tone: "bg-neutral-300", caption: "封面 04", src: "/images/project-one/1786700856939-_______2026-08-14_174017.png" },
      { id: "a-cover-5", tone: "bg-neutral-300", caption: "封面 05", src: "/images/project-one/1786701209422-_______2026-08-14_175239.png" },
      { id: "a-cover-6", tone: "bg-neutral-300", caption: "封面 06", src: "/images/project-one/1786701211986-_______2026-08-14_175147.png" },
      { id: "a-cover-7", tone: "bg-neutral-300", caption: "封面 07", src: "/images/project-one/1786701216631-_______2026-08-14_175056.png" },
      { id: "a-cover-8", tone: "bg-neutral-300", caption: "封面 08", src: "/images/project-one/1786701229749-_______2026-08-14_175009.png" },
      { id: "a-cover-9", tone: "bg-neutral-300", caption: "封面 09", src: "/images/project-one/1786701820696-_______2026-08-14_180258.png" },
      { id: "a-cover-10", tone: "bg-neutral-300", caption: "封面 10", src: "/images/project-one/1786701824261-_______2026-08-14_180200.png" },
      { id: "a-cover-1", tone: "bg-neutral-300", caption: "封面 01", src: "/images/project-one/cover-01.png" },
    ],
    chapters: [
      {
        key: "design",
        title: "建築設計",
        text: "〔佔位文字，抓版面用〕常民竹小屋回應的是「常民」與「構造」之間的距離——不是為了展示工法而蓋，而是回到最基本的生活尺度，思考人如何在竹構造的空間裡靜下來、待下來、慢慢住進去。整體配置刻意保留低矮、貼近地面的姿態，讓建築物退居成背景，把使用者的日常動作留在畫面中央，也呼應基地周邊聚落原有的生活紋理與尺度感，避免用一棟過於張揚的量體打斷既有的地景關係。\n\n空間的開放程度、遮蔽與穿透的比例，都在設計初期反覆推敲，希望呈現一種介於室內與戶外之間、隨天氣與時間而變化的曖昧邊界。屋簷深淺、開口大小、動線轉折，每一個決定背後都對應著一段關於「怎麼住」的具體想像，而不只是造型上的考量，也希望觀者走進這個空間時能感受到細節的體貼。\n\n這裡先以現場影像鋪陳整體氛圍，設計圖說與正式論述文字之後會陸續補上，讓讀者可以從照片本身感受空間的尺度與光影變化。",
        // 這批照片先重複借用工地現場的 10 張真實照片＋幾張網路免版權風景照湊出「5～10 張」的
        // 展示份量（見下方各章節同樣的作法），純粹是為了讓自動排版演算法（lib/photoLayout.ts）
        // 有足夠多樣的形狀可以排——之後有正式素材要替換時，直接改這裡的 images 陣列即可，
        // 排版會自動跟著新照片的形狀重算，不用動排版邏輯本身。
        images: [
          { id: "a-design-1", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786700848131-_______2026-08-14_173851.png" },
          { id: "a-design-2", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786700851881-_______2026-08-14_173939.png" },
          { id: "a-design-3", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-1.jpg" },
          { id: "a-design-4", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-2.jpg" },
          { id: "a-design-5", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701211986-_______2026-08-14_175147.png" },
          { id: "a-design-6", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786700856939-_______2026-08-14_174017.png" },
          { id: "a-design-7", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701229749-_______2026-08-14_175009.png" },
        ],
        moreImages: [
          { id: "a-design-more-1", tone: "bg-neutral-300", caption: "基地紋理分析圖" },
          { id: "a-design-more-2", tone: "bg-neutral-400", caption: "空間量體推演手稿" },
          { id: "a-design-more-3", tone: "bg-neutral-300", caption: "動線與開口研究模型" },
        ],
      },
      {
        key: "module",
        title: "模矩",
        text: "〔佔位文字，抓版面用〕模矩系統是整個構造邏輯的起點：以單根竹材的常見長度與直徑為基準，反推出一套可重複、可搭接的單元尺寸，讓每一個構件都能在不同的位置上互換使用，降低現場裁切與浪費，也讓非專業的參與者更容易理解整個系統的組成方式，這套模矩同時也決定了立面的節奏與比例。\n\n從平面到剖面，模矩的網格貫穿整個設計，也成為施工階段溝通的共同語言——工班不需要逐一讀圖，只要理解模矩邏輯，就能判斷構件該落在哪裡，大幅降低溝通成本與現場出錯的機率，這種「先定規則、再長出形狀」的做法，是竹構造回應手工與效率之間拉扯的具體嘗試。\n\n這批照片先呈現模矩單元在不同位置重複出現的樣子，實際尺寸表與詳細圖說之後會補上，讓論述更精確、更可被驗證。",
        images: [
          { id: "a-module-1", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786700856939-_______2026-08-14_174017.png" },
          { id: "a-module-2", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786701209422-_______2026-08-14_175239.png" },
          { id: "a-module-3", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701820696-_______2026-08-14_180258.png" },
          { id: "a-module-4", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-3.jpg" },
          { id: "a-module-5", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786700848131-_______2026-08-14_173851.png" },
          { id: "a-module-6", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786700856939-_______2026-08-14_174017.png" },
        ],
        moreImages: [
          { id: "a-module-more-1", tone: "bg-neutral-300", caption: "模矩尺寸推演草圖" },
          { id: "a-module-more-2", tone: "bg-neutral-400", caption: "單元接合方式測試" },
          { id: "a-module-more-3", tone: "bg-neutral-300", caption: "模矩網格對應立面圖" },
        ],
      },
      {
        key: "structure",
        title: "構造",
        text: "〔佔位文字，抓版面用〕構造系統採用竹材本身的彈性與韌性作為設計出發點，主結構以桁架式的組合方式，將荷重層層分散到地面基礎，減少對單一構件強度的依賴，也讓整體結構在面對不規則外力時，能有一定程度的彈性緩衝而不至於瞬間破壞，這也是竹構造回應環境不確定性的方式之一。\n\n接點的處理是整個構造裡最關鍵的一環，既要傳遞力量，也要保留竹材熱脹冷縮與含水率變化的空間，多數接點採用綁紮與栓接混合的方式，而非單一膠合固定，讓未來的維護、替換單一構件成為可能，也呼應「常民構造」該有的可修復性格——壞掉的地方可以局部處理，不用整棟拆除重建。\n\n這裡先用現場照片呈現桁架與接點的實際樣貌，完整結構計算報告與細部接點圖說之後會補齊，讓論述更貼近實際施作。",
        images: [
          { id: "a-structure-1", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701211986-_______2026-08-14_175147.png" },
          { id: "a-structure-2", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786701216631-_______2026-08-14_175056.png" },
          { id: "a-structure-3", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701229749-_______2026-08-14_175009.png" },
          { id: "a-structure-4", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786701824261-_______2026-08-14_180200.png" },
          { id: "a-structure-5", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-4.jpg" },
          { id: "a-structure-6", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/cover-01.png" },
          { id: "a-structure-7", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701209422-_______2026-08-14_175239.png" },
          { id: "a-structure-8", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786700851881-_______2026-08-14_173939.png" },
        ],
        moreImages: [
          { id: "a-structure-more-1", tone: "bg-neutral-300", caption: "桁架系統受力分析圖" },
          { id: "a-structure-more-2", tone: "bg-neutral-400", caption: "接點細部大樣圖" },
          { id: "a-structure-more-3", tone: "bg-neutral-300", caption: "結構模型局部" },
        ],
      },
      {
        key: "construction",
        title: "施工",
        text: "〔佔位文字，抓版面用〕施工過程刻意保留了手工參與的比例，從竹材的選料、防腐處理，到現場組裝，都邀請在地工班與志工共同完成，而不是全部交給機具與預製構件。這個決定讓整體工期拉長，卻也讓構造本身多了一層「這裡的人親手蓋起來」的重量，也讓參與者對這個空間產生更深的認同與情感連結，這種參與感也是「常民構造」想傳遞的核心精神之一。\n\n現場搭建分成基礎放樣、主結構立起、次結構填充、屋面收頭四個階段，每個階段都留下影像與圖說紀錄，作為未來其他基地複製這套工法的參考。施工過程中遇到的天氣延誤、材料調度、人力調配等實際狀況，之後也會整理成完整的施工紀錄放進這個章節，讓經驗可以被傳承。\n\n這批照片先記錄搭建現場的幾個關鍵時刻，讓經驗可以被傳承，而不只是留在少數人的記憶裡。",
        images: [
          { id: "a-construction-1", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701229749-_______2026-08-14_175009.png" },
          { id: "a-construction-2", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786701820696-_______2026-08-14_180258.png" },
          { id: "a-construction-3", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-5.jpg" },
          { id: "a-construction-4", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786700848131-_______2026-08-14_173851.png" },
          { id: "a-construction-5", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-one/1786701824261-_______2026-08-14_180200.png" },
          { id: "a-construction-6", tone: "bg-neutral-400", caption: "〔照片說明待補〕", src: "/images/project-one/1786701229749-_______2026-08-14_175009.png" },
        ],
        moreImages: [
          { id: "a-construction-more-1", tone: "bg-neutral-300", caption: "施工放樣過程紀錄" },
          { id: "a-construction-more-2", tone: "bg-neutral-400", caption: "現場組裝步驟紀錄" },
          { id: "a-construction-more-3", tone: "bg-neutral-300", caption: "收尾細節紀錄" },
        ],
      },
      {
        key: "assembly",
        title: "組裝說明書",
        text: "〔佔位文字，抓版面用〕組裝說明書把整個搭建過程拆解成可依序執行的步驟，從構件編號、接點對應，到工具與人力需求，都以圖解方式呈現，目標是讓沒有專業背景的人也能參與部分組裝作業，延續「常民構造」的精神，也讓這套工法有機會被複製到其他地方使用，而不是只存在於這一次的搭建現場。",
        images: [], // 這一章不用照片，首頁跟內頁都用 PDF 第一頁即時渲染出來的封面代表（見 PhotoStream.tsx／AssemblySection）
        pdf: { url: "/files/project-one/assembly.pdf", label: "組裝說明書 PDF（範例檔案，待替換成正式版本）" },
      },
      {
        key: "site",
        title: "基地",
        text: "〔佔位文字，抓版面用〕基地位於林鐵沿線的一處緩坡地，周邊仍保留部分原始植被與早期聚落的動線紋理，鐵道的存在讓這塊土地帶有一種介於自然與人為建設之間的曖昧性格。建築量體刻意退讓在坡地的角落，把最好的視野留給穿越基地的既有步道，也盡量減少對原有地表植被的擾動，讓新的構造物像是從既有紋理裡長出來的，而不是外來的植入。\n\n基地環境的日照角度、風向與雨水排放路徑，都直接影響了竹構造的方位與屋簷出挑的深度，設計並非憑空而來，而是先讀懂基地、再回應基地，這也是整個團隊在動工前花最多時間反覆現勘與測繪的階段。周邊居民對這塊土地的記憶與使用習慣，也是設計過程中重要的參考依據。實際地址與座標尚未提供，下方地圖會在資料到位後標示出精確位置。",
        images: [], // 基地章節不用照片，首頁跟內頁都用地圖代表（見 ChapterMap）
      },
    ],
    coordinates: undefined, // 待使用者提供實際地址／經緯度
    published: true,
  },
  {
    slug: "project-two",
    shortLabel: "作品 B",
    name: "一籌",
    location: "地點待補",
    year: "年份待補",
    type: "類型待補",
    intro: "〔佔位文字，約150字，抓版面用〕一籌是這次展覽的第二件作品，展現與常民竹小屋不同的語氣與空間態度。這段文字作為整體概述，說明作品的設計思考、構造精神與施工方式，之後會替換成正式的策展論述文字。",
    accent: "#39FF14",
    titleAlign: "right",
    coverImages: [
      { id: "b-cover-1", tone: "bg-neutral-300", caption: "封面 01", src: "/images/project-two/cover-01.png" },
      { id: "b-cover-2", tone: "bg-neutral-400", caption: "封面 02" },
    ],
    chapters: [
      {
        key: "design",
        title: "建築設計",
        text: "〔佔位文字，抓版面用〕一籌的設計命題與常民竹小屋不同，它更像是一次對「臨時性」構造的重新詮釋——不追求恆久留存，而是思考一個構造物如何在短暫的使用週期裡，依然給人足夠的空間品質與情感重量。量體刻意輕盈、通透，讓光線與周邊環境自由穿越，也讓觀者不會把它誤認成一棟「正式的建築」，而是更接近一個暫時搭起的場景。\n\n整體造型語彙走向更抽象、更幾何的方向，減少裝飾性的細節，讓竹材本身的紋理與結構邏輯成為唯一的表情。這種克制的態度，也是一籌與常民竹小屋在同一個展覽裡相互對話、彼此襯托的方式——一個貼地生根、一個輕盈暫留，兩種對「住」的想像並置出現，讓觀眾來回走動時能感受到語氣落差。\n\n這裡先用現場影像鋪陳整體氛圍，正式論述文字與圖說之後會補上，讓讀者先從畫面感受空間的輕盈感。",
        // project-two 目前只有一張真實照片（cover-01.png），其餘先用網路免版權風景照湊出
        // 「5～10 張」的展示份量——跟 project-one 一樣，純粹是為了讓排版演算法有形狀可以排，
        // 之後補上正式空拍／現場照片時直接替換這裡的 src 即可。
        images: [
          { id: "b-design-1", tone: "bg-neutral-300", caption: "〔照片說明待補〕", src: "/images/project-two/cover-01.png" },
          { id: "b-design-2", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-1.jpg" },
          { id: "b-design-3", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-2.jpg" },
          { id: "b-design-4", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-1.jpg" },
          { id: "b-design-5", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-2.jpg" },
          { id: "b-design-6", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/square-1.jpg" },
          { id: "b-design-7", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-3.jpg" },
        ],
        moreImages: [
          { id: "b-design-more-1", tone: "bg-neutral-300", caption: "基地紋理分析圖" },
          { id: "b-design-more-2", tone: "bg-neutral-400", caption: "空間量體推演手稿" },
          { id: "b-design-more-3", tone: "bg-neutral-300", caption: "動線與開口研究模型" },
        ],
      },
      {
        key: "module",
        title: "模矩",
        text: "〔佔位文字，抓版面用〕一籌的模矩系統採用比常民竹小屋更小、更密的單元尺寸，讓構造在視覺上呈現細膩的紋理感，也更貼近臨時構造需要快速搭拆的操作邏輯。每個模矩單元的重量與尺寸都控制在單人可搬運的範圍內，讓搭建過程不需要依賴大型機具，也讓非專業人員能獨立完成部分組裝工作，降低參與的門檻。\n\n小尺度模矩帶來的代價是接點數量大幅增加，因此設計團隊另外發展了一套快拆式的連接構件，讓組裝與拆卸都能在短時間內完成，同時維持結構的穩定性，也讓一籌具備在不同場地間反覆巡迴展出的可能性，這套取捨是整個設計過程反覆測試最多次的環節，前後修改了好幾個版本才定案。\n\n這批照片先呈現模矩單元與快拆構件的實際樣貌，細部圖說與構件清單之後會整理進這個章節。",
        images: [
          { id: "b-module-1", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/pano-1.jpg" },
          { id: "b-module-2", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-3.jpg" },
          { id: "b-module-3", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-4.jpg" },
          { id: "b-module-4", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/square-2.jpg" },
          { id: "b-module-5", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-4.jpg" },
          { id: "b-module-6", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-5.jpg" },
        ],
        moreImages: [
          { id: "b-module-more-1", tone: "bg-neutral-300", caption: "模矩尺寸推演草圖" },
          { id: "b-module-more-2", tone: "bg-neutral-400", caption: "快拆構件測試" },
          { id: "b-module-more-3", tone: "bg-neutral-300", caption: "模矩網格對應立面圖" },
        ],
      },
      {
        key: "structure",
        title: "構造",
        text: "〔佔位文字，抓版面用〕一籌的結構邏輯偏向輕構造（light structure）的思路，用大量小斷面的竹材互相支撐，取代少數幾根粗大構件的傳統做法，整體重量因此大幅降低，也讓構造本身帶有一種輕盈、幾乎懸浮的視覺效果，與常民竹小屋厚實穩重的量體形成對比，成為兩件作品結構性格的直接對照。\n\n為了因應快速搭拆的需求，結構系統刻意避免使用不可逆的接合方式，改以夾具與繩索張力共同維持整體穩定，這也讓一籌得以在不同基地之間重複搭建、成為一個可移動的展示構造，而不是綁定在單一地點的固定建物，每一次搭建與拆卸都會對構件進行檢查與微調，確保重複使用不影響安全。\n\n這裡先用現場照片呈現夾具與張力構件的樣貌，結構驗算資料與接點測試紀錄之後會補上。",
        images: [
          { id: "b-structure-1", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-6.jpg" },
          { id: "b-structure-2", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-5.jpg" },
          { id: "b-structure-3", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/pano-2.jpg" },
          { id: "b-structure-4", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-1.jpg" },
          { id: "b-structure-5", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/square-1.jpg" },
          { id: "b-structure-6", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-6.jpg" },
          { id: "b-structure-7", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-2.jpg" },
          { id: "b-structure-8", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-1.jpg" },
        ],
        moreImages: [
          { id: "b-structure-more-1", tone: "bg-neutral-300", caption: "輕構造受力分析圖" },
          { id: "b-structure-more-2", tone: "bg-neutral-400", caption: "夾具接點細部大樣圖" },
          { id: "b-structure-more-3", tone: "bg-neutral-300", caption: "結構模型局部" },
        ],
      },
      {
        key: "construction",
        title: "施工",
        text: "〔佔位文字，抓版面用〕一籌的施工強調「速度」與「可重複」——整個搭建過程被拆解成標準化的動作序列，讓不熟悉竹構造的人員也能在短時間的教學後加入搭建工作，這也是這件作品作為教育示範的重要部分，希望降低一般人對竹構造「很難、很專業」的距離感，讓更多人願意親手嘗試、參與這套系統的運作。\n\n現場施工分成基座定位、模組組裝、整體校正、收邊固定四個階段，每個階段都控制在明確的時間範圍內，作為未來巡迴展示時工班排程的參考依據，每次搭建也會邀請幾位第一次接觸的參與者，藉此驗證教學流程是否真的容易上手，並蒐集他們的操作回饋來修正教學步驟。\n\n這批照片先記錄幾次巡迴搭建的現場片段，詳細的施工時間紀錄之後會補齊放入這個章節。",
        images: [
          { id: "b-construction-1", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-2.jpg" },
          { id: "b-construction-2", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-3.jpg" },
          { id: "b-construction-3", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/pano-1.jpg" },
          { id: "b-construction-4", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/square-2.jpg" },
          { id: "b-construction-5", tone: "bg-neutral-300", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/landscape-4.jpg" },
          { id: "b-construction-6", tone: "bg-neutral-400", caption: "〔網路免版權風景照，待替換〕", src: "/images/stock/portrait-3.jpg" },
        ],
        moreImages: [
          { id: "b-construction-more-1", tone: "bg-neutral-300", caption: "動作序列教學拆解" },
          { id: "b-construction-more-2", tone: "bg-neutral-400", caption: "快拆組裝步驟紀錄" },
          { id: "b-construction-more-3", tone: "bg-neutral-300", caption: "巡迴搭建現場紀錄" },
        ],
      },
      {
        key: "assembly",
        title: "組裝說明書",
        text: "〔佔位文字，抓版面用〕由於一籌的快拆設計，組裝說明書的角色比常民竹小屋更吃重——它不只是紀錄用的圖說，而是實際搭建時工班會隨身攜帶、逐步對照的操作手冊，內容以清楚的步驟編號與簡化圖示為主，減少現場判斷錯誤的機會，也讓不同批次的工班都能維持一致的搭建品質，即使換了一批完全沒經驗的人手也能照著操作。",
        images: [], // 這一章不用照片，首頁跟內頁都用 PDF 第一頁即時渲染出來的封面代表（見 PhotoStream.tsx／AssemblySection）
        pdf: { url: "/files/project-two/assembly.pdf", label: "組裝說明書 PDF（範例檔案，待替換成正式版本）" },
      },
      {
        key: "site",
        title: "基地",
        text: "〔佔位文字，抓版面用〕一籌設計為可移動、可重複搭建的構造，因此「基地」對它而言不是單一固定的地點，而是一系列曾經或即將停留的場所。本次展覽選定的基地是林鐵沿線一處開闊的空地，視野開放、便於觀眾從各個角度接近作品，也方便未來拆卸移動到下一個展出地點，延續這件作品「四處暫留」的展示邏輯。\n\n基地的臨時性格也回應了一籌本身「暫留」的設計命題——構造與土地之間不是永久佔有的關係，而是短暫借用之後再歸還，這種關係本身也是這件作品想要傳達的核心價值之一。每一次移動到新的場地，團隊都會重新評估地形與人流動線，微調搭建的方向與配置，讓同一套構造也能長出不同的樣貌。實際地址與座標尚未提供，下方地圖會在資料到位後標示出精確位置。",
        images: [], // 基地章節不用照片，首頁跟內頁都用地圖代表（見 ChapterMap）
      },
    ],
    coordinates: undefined, // 待使用者提供實際地址／經緯度
    published: true,
  },
];

export function getPublishedProjects(): Project[] {
  return projects.filter((p) => p.published);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
