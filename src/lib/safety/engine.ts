import { checkIncompatibilities } from "./incompatibilities";
import { checkFears } from "./fears";
import { checkDoseLimit } from "./dose-limits";
import { checkPregnancyContraindications } from "./pregnancy";
import type { SafetyViolation, SafetyCheckResult } from "./models";
import type { Prescription, Patient } from "../core/models";

export class SafetyEngine {
  /**
   * Check 18 incompatibilities (十八反)
   */
  checkIncompatibilities(herbs: string[]): SafetyViolation[] {
    const pairs = checkIncompatibilities(herbs);
    return pairs.map(([herbA, herbB]) => ({
      ruleType: "incompatibility" as const,
      description: `十八反：${herbA}与${herbB}不可同用`,
      severity: "critical" as const,
      involvedHerbs: [herbA, herbB],
    }));
  }

  /**
   * Check 19 fears (十九畏)
   */
  checkFears(herbs: string[]): SafetyViolation[] {
    const pairs = checkFears(herbs);
    return pairs.map(([herbA, herbB]) => ({
      ruleType: "fear" as const,
      description: `十九畏：${herbA}与${herbB}不宜同用`,
      severity: "warning" as const,
      involvedHerbs: [herbA, herbB],
    }));
  }

  /**
   * Check dose against Pharmacopoeia limits
   */
  checkDosage(herb: string, doseGrams: number): SafetyViolation[] {
    const result = checkDoseLimit(herb, doseGrams);
    if (result.valid || !result.message) {
      return [];
    }
    return [{
      ruleType: "overdose" as const,
      description: result.message,
      severity: "critical" as const,
      involvedHerbs: [herb],
    }];
  }

  /**
   * Check pregnancy contraindications
   */
  checkPregnancy(herbs: string[], isPregnant: boolean): SafetyViolation[] {
    if (!isPregnant) {
      return [];
    }
    const contraindicated = checkPregnancyContraindications(herbs);
    return contraindicated.map(herb => ({
      ruleType: "pregnancy" as const,
      description: `孕妇禁用：${herb}`,
      severity: "critical" as const,
      involvedHerbs: [herb],
    }));
  }

  /**
   * Validate a complete prescription
   */
  validatePrescription(prescription: Prescription, patient: Patient): SafetyCheckResult {
    const herbNames = prescription.herbs.map(h => h.name);
    const violations: SafetyViolation[] = [];

    // Check incompatibilities (十八反)
    violations.push(...this.checkIncompatibilities(herbNames));

    // Check fears (十九畏)
    violations.push(...this.checkFears(herbNames));

    // Check dosage
    for (const herb of prescription.herbs) {
      violations.push(...this.checkDosage(herb.name, herb.doseGrams));
    }

    // Check pregnancy
    violations.push(...this.checkPregnancy(herbNames, patient.isPregnant));

    const hasCritical = violations.some(v => v.severity === "critical");

    return {
      passed: violations.length === 0,
      violations,
      blocking: hasCritical,
    };
  }
}
