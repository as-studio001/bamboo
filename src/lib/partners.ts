// （2026-10-20）首頁最尾端的單位 LOGO 列（主辦／承辦／參加團隊），存在 content/partners.json。
// logo 留空的單位顯示文字名稱；url 留空就不做成連結。
import partnersData from "../../content/partners.json";

// （2026-11-05）catalog：有填時點 LOGO 不直接開官網，改跳出視窗看型錄（見 PartnerCatalog.tsx）；
// 型錄每頁一張圖，放在 dir 底下，檔名 p01.jpg、p02.jpg…，count 是總頁數
export type PartnerCatalog = { title: string; dir: string; count: number };
export type Partner = { name: string; logo?: string; url?: string; catalog?: PartnerCatalog };
export type PartnerGroup = { label: string; items: Partner[] };

export const partnerGroups: PartnerGroup[] = (partnersData as { groups?: PartnerGroup[] }).groups ?? [];
