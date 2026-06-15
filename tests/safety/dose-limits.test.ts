import { describe, it, expect } from "vitest";
import { PHARMACOPOEIA_DOSE_LIMITS, checkDoseLimit } from "@/lib/safety/dose-limits";

describe("Pharmacopoeia Dose Limits", () => {
  it("validates dose within limits", () => {
    const result = checkDoseLimit("麻黄", 5.0);
    expect(result.valid).toBe(true);
    expect(result.limit).toEqual([2.0, 10.0]);
    expect(result.message).toBeNull();
  });

  it("rejects dose below minimum", () => {
    const result = checkDoseLimit("麻黄", 1.0);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("低于药典最低剂量");
  });

  it("rejects dose above maximum", () => {
    const result = checkDoseLimit("麻黄", 15.0);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("超过药典最高剂量");
  });

  it("returns valid for unknown herbs", () => {
    const result = checkDoseLimit("未知药材", 10.0);
    expect(result.valid).toBe(true);
    expect(result.limit).toBeNull();
  });

  it.each(Object.entries(PHARMACOPOEIA_DOSE_LIMITS))(
    "validates %s within [%s, %s]",
    (herb, [min, max]) => {
      const validResult = checkDoseLimit(herb, (min + max) / 2);
      expect(validResult.valid).toBe(true);
    }
  );
});
