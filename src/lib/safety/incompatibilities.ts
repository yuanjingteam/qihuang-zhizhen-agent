/**
 * 十八反 (18 Incompatibilities)
 *
 * Traditional Chinese Medicine incompatibility rules.
 * These herb combinations MUST be intercepted.
 */

export const INCOMPATIBILITIES_18: [string, string][] = [
  // 甘草反
  ["甘草", "甘遂"],
  ["甘草", "大戟"],
  ["甘草", "芫花"],
  ["甘草", "海藻"],

  // 乌头反
  ["乌头", "贝母"],
  ["乌头", "瓜蒌"],
  ["乌头", "半夏"],
  ["乌头", "白蔹"],
  ["乌头", "白及"],

  // 藜芦反
  ["藜芦", "人参"],
  ["藜芦", "沙参"],
  ["藜芦", "丹参"],
  ["藜芦", "玄参"],
  ["藜芦", "细辛"],
  ["藜芦", "芍药"],
];

/**
 * Check if a list of herbs contains any incompatibility pairs
 */
export function checkIncompatibilities(herbs: string[]): [string, string][] {
  const violations: [string, string][] = [];
  const herbSet = new Set(herbs);

  for (const [herbA, herbB] of INCOMPATIBILITIES_18) {
    if (herbSet.has(herbA) && herbSet.has(herbB)) {
      violations.push([herbA, herbB]);
    }
  }

  return violations;
}
