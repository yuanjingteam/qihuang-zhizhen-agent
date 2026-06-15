import { describe, it, expect } from "vitest";
import { INCOMPATIBILITIES_18, checkIncompatibilities } from "@/lib/safety/incompatibilities";

describe("18 Incompatibilities (十八反)", () => {
  it.each(INCOMPATIBILITIES_18)("intercepts %s + %s", (herbA, herbB) => {
    const violations = checkIncompatibilities([herbA, herbB]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toEqual([herbA, herbB]);
  });

  it("returns empty array when no incompatibilities", () => {
    const violations = checkIncompatibilities(["人参", "黄芪", "白术"]);
    expect(violations).toHaveLength(0);
  });

  it("detects multiple incompatibilities", () => {
    const violations = checkIncompatibilities(["甘草", "甘遂", "乌头", "贝母"]);
    expect(violations).toHaveLength(2);
  });
});
