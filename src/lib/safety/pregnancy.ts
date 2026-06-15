/**
 * 孕妇禁忌 (Pregnancy Contraindications)
 *
 * Herbs that are contraindicated during pregnancy.
 */

export const PREGNANCY_CONTRAINDICATED_HERBS: string[] = [
  // 峻下逐水药
  "甘遂",
  "大戟",
  "芫花",
  "商陆",
  "牵牛子",

  // 活血化瘀药
  "三棱",
  "莪术",
  "水蛭",
  "虻虫",
  "斑蝥",
  "穿山甲",
  "王不留行",

  // 峻下药
  "大黄",
  "芒硝",
  "巴豆",
  "番泻叶",

  // 芳香走窜药
  "麝香",
  "冰片",
  "苏合香",

  // 有毒药
  "附子",
  "乌头",
  "天南星",
  "半夏",
  "马钱子",
  "雄黄",
  "砒霜",
  "轻粉",
  "铅丹",

  // 破气药
  "枳实",
  "枳壳",

  // 其他
  "益母草",
  "红花",
  "桃仁",
  "牛膝",
  "薏苡仁",  // 大剂量
  "蒲黄",
  "五灵脂",
];

/**
 * Check if any herbs in the prescription are contraindicated for pregnancy
 */
export function checkPregnancyContraindications(herbs: string[]): string[] {
  const violations: string[] = [];

  for (const herb of herbs) {
    if (PREGNANCY_CONTRAINDICATED_HERBS.includes(herb)) {
      violations.push(herb);
    }
  }

  return violations;
}
