// 「策展宣言」是整個展覽共用的一份文字（不屬於任何一個建築案），跟「活動」一樣走 git-based CMS：
// 存在 content/manifesto.json，前台建置時直接 import；後台 /admin 的「策展宣言」編輯畫面負責
// 寫回這個檔案。四個欄位對應宣言頁由上到下的四塊文字，lead／body 裡的換行會原樣保留。
import manifestoData from "../../content/manifesto.json";

export type Manifesto = {
  eyebrow?: string; // 最上面的小字（等寬字、灰色）
  title?: string; // 大標
  lead?: string; // 標題下方的重點段落（襯線字）
  body?: string; // 最下面的灰色內文
};

export const manifesto: Manifesto = manifestoData as Manifesto;
