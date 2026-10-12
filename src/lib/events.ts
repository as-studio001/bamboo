// 「活動」是整個展覽共用的一份資訊（不屬於任何一個建築案），跟案例內容一樣走 git-based CMS：
// 存在 content/events.json，前台建置時直接 import；後台 /admin 的「活動」區塊之後會負責寫回
// 這個檔案（目前後台那一區先留白，欄位還沒規劃）。首頁頂部選單「基地」右邊的「活動」、首頁
// 最尾端的活動畫面、案例內頁最尾端的活動區塊，讀的都是這同一份。
import eventsData from "../../content/events.json";

export type ExhibitionEvents = {
  title: string;
  text?: string; // 段落文字，用 \n\n 分段；留空時前台顯示「活動資訊即將公布」
};

export const exhibitionEvents: ExhibitionEvents = eventsData as ExhibitionEvents;

// 選單用的固定 key／標題——跟章節 key（design／module…／site）放在同一排選單裡，
// 但不是章節，不存在 project.chapters 裡。
export const EVENTS_KEY = "events";
