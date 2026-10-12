// 「活動」是整個展覽共用的一份資訊（不屬於任何一個建築案），跟案例內容一樣走 git-based CMS：
// 存在 content/events.json，前台建置時直接 import；後台 /admin 的「活動」編輯畫面負責寫回
// 這個檔案（海報上傳到 public/images/events/）。首頁頂部選單「基地」右邊的「活動」、首頁
// 最尾端的活動畫面、案例內頁最尾端的活動區塊，讀的都是這同一份。
import eventsData from "../../content/events.json";

export type EventPoster = {
  id: string;
  src: string;
  caption?: string;
};

export type ExhibitionEvents = {
  title: string;
  text?: string; // 段落文字，用 \n\n 分段；文字跟海報都留空時前台顯示「活動資訊即將公布」
  posters?: EventPoster[];
};

export const exhibitionEvents: ExhibitionEvents = eventsData as ExhibitionEvents;

// 選單用的固定 key／標題——跟章節 key（design／module…／site）放在同一排選單裡，
// 但不是章節，不存在 project.chapters 裡。
export const EVENTS_KEY = "events";
