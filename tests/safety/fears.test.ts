import { describe, it, expect } from "vitest";
import { FEARS_19, checkFears } from "@/lib/safety/fears";

describe("19 Fears (十九畏)", () => {
  it.each(FEARS_19)("intercepts %s + %s", (herbA, herbB) => {
    const violations = checkFears([herbA, herbB]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toEqual([herbA, herbB]);
  });

  it("returns empty array when no fears", () => {
    const violations = checkFears(["人参", "黄芪", "白术"]);
    expect(violations).toHaveLength(0);
  });
});
