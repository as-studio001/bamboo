// （2026-10-20）首頁最尾端的單位 LOGO 列（主辦／承辦／參加團隊），存在 content/partners.json。
// logo 留空的單位顯示文字名稱；url 留空就不做成連結。
import partnersData from "../../content/partners.json";

export type Partner = { name: string; logo?: string; url?: string };
export type PartnerGroup = { label: string; items: Partner[] };

export const partnerGroups: PartnerGroup[] = (partnersData as { groups?: PartnerGroup[] }).groups ?? [];
