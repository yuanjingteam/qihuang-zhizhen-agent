import { describe, it, expect } from "vitest";
import { PREGNANCY_CONTRAINDICATED_HERBS, checkPregnancyContraindications } from "@/lib/safety/pregnancy";

describe("Pregnancy Contraindications", () => {
  it.each(PREGNANCY_CONTRAINDICATED_HERBS)("intercepts %s for pregnant women", (herb) => {
    const violations = checkPregnancyContraindications([herb]);
    expect(violations).toContain(herb);
  });

  it("returns empty array for safe herbs", () => {
    const violations = checkPregnancyContraindications(["黄芪", "白术", "茯苓"]);
    expect(violations).toHaveLength(0);
  });

  it("detects multiple contraindicated herbs", () => {
    const violations = checkPregnancyContraindications(["麝香", "三棱", "莪术"]);
    expect(violations).toHaveLength(3);
  });
});
