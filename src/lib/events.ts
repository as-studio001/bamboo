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

export type EventPerson = { name: string; role?: string };
export type EventSlide = { title: string; url: string };

// （2026-11-05）單場講座：首頁活動畫面往右滑的場次頁（見 EventsSection.tsx 的 LecturePanel）。
// 文字照邀請函；slides 是講者簡報（標題＋檔案網址），還沒有時前台不顯示這一列。
export type EventLecture = {
  id: string;
  tab: string; // 上方分頁的短名，例如「場次一」
  label?: string; // 例如「LECTURE 01」
  date: string;
  weekday?: string;
  time?: string;
  theme?: string; // 例如「記憶與工法」
  title: string;
  text?: string;
  speakers?: EventPerson[];
  hosts?: EventPerson[];
  poster?: string;
  slides?: EventSlide[];
};

// 標題（「活動」這兩個字）跟章節名稱放在一起管理，見 lib/chapters.ts 的 chapterLabel("events")。
export type ExhibitionEvents = {
  text?: string; // 段落文字，用 \n\n 分段；文字跟海報都留空時前台顯示「活動資訊即將公布」
  posters?: EventPoster[];
  venue?: string; // 講座地點（各場次共用）
  venueAddress?: string;
  signupUrl?: string; // 報名表單（各場次共用）
  lectures?: EventLecture[];
};

export const exhibitionEvents: ExhibitionEvents = eventsData as ExhibitionEvents;

// 選單用的固定 key／標題——跟章節 key（design／module…／site）放在同一排選單裡，
// 但不是章節，不存在 project.chapters 裡。
export const EVENTS_KEY = "events";
