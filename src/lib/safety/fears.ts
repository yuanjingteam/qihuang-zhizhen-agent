/**
 * 十九畏 (19 Fears)
 *
 * Traditional Chinese Medicine fear/incompatibility rules.
 * These herb combinations should be avoided.
 */

export const FEARS_19: [string, string][] = [
  ["硫黄", "朴硝"],
  ["水银", "砒霜"],
  ["狼毒", "密陀僧"],
  ["巴豆", "牵牛"],
  ["丁香", "郁金"],
  ["牙硝", "三棱"],
  ["川乌", "草乌"],
  ["人参", "五灵脂"],
  ["官桂", "石脂"],
];

/**
 * Check if a list of herbs contains any fear pairs
 */
export function checkFears(herbs: string[]): [string, string][] {
  const violations: [string, string][] = [];
  const herbSet = new Set(herbs);

  for (const [herbA, herbB] of FEARS_19) {
    if (herbSet.has(herbA) && herbSet.has(herbB)) {
      violations.push([herbA, herbB]);
    }
  }

  return violations;
}
