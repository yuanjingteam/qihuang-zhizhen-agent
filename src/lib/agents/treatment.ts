import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";
import type { Prescription } from "../core/models";

/**
 * Treatment Agent
 *
 * Establish treatment principle and generate prescription.
 * Safety validation is handled by the separate SafetyCheckAgent node
 * in the Graph — not here. If safety fails, the Graph routes back
 * here with the violations info for adjustment.
 */

export class TreatmentAgent extends BaseAgent {
  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, diagnosisResults, safetyResult } = state;

    if (!diagnosisResults || diagnosisResults.length === 0) {
      return {
        treatmentPrinciple: "",
        prescription: null,
      };
    }

    const diagnosis = diagnosisResults[0];
    const primarySyndrome = diagnosis.topKSyndromes[0];

    if (!primarySyndrome) {
      return {
        treatmentPrinciple: "",
        prescription: null,
      };
    }

    // If we have safety violations from a previous pass, adjust the prescription
    if (safetyResult && !safetyResult.passed) {
      const currentPrescription = state.prescription;
      if (currentPrescription) {
        const adjusted = this.adjustForSafety(currentPrescription, safetyResult.violations);
        return {
          prescription: adjusted,
        };
      }
    }

    // Generate new treatment principle and prescription
    const result = await this.generatePrescription(patient, primarySyndrome);

    return {
      treatmentPrinciple: result.principle,
      prescription: result.prescription,
    };
  }

  private async generatePrescription(patient: any, syndrome: any): Promise<{
    principle: string;
    prescription: Prescription;
  }> {
    const safetyHint = patient.isPregnant
      ? "注意：患者为孕妇，请避免使用孕妇禁忌药物（如麝香、附子、大黄、红花、桃仁等）。"
      : "";

    const result = await this.callLLM(
      [
        {
          role: "system",
          content: `你是一个中医处方AI。根据证型生成治法和方剂。
          返回JSON格式：{
            "principle": "治法",
            "formula": "方剂名",
            "herbs": [{"name": "药名", "doseGrams": 剂量, "processing": "炮制", "role": "君/臣/佐/使"}],
            "modifications": "加减说明",
            "usage": "煎服法"
          }`,
        },
        {
          role: "user",
          content: `证型：${syndrome.name}
主要症状：${syndrome.evidence.join("、")}
患者信息：${patient.age}岁，${patient.sex}
${safetyHint}`,
        },
      ],
      {} as any,
      ""
    );

    try {
      const parsed = JSON.parse(result);
      return {
        principle: parsed.principle,
        prescription: {
          treatmentPrinciple: parsed.principle,
          formulaName: parsed.formula,
          herbs: parsed.herbs.map((h: any) => ({
            name: h.name,
            pinyin: "",
            doseGrams: h.doseGrams,
            processing: h.processing || null,
            role: h.role || "臣",
          })),
          modifications: parsed.modifications,
          usage: parsed.usage,
        },
      };
    } catch {
      return {
        principle: "调理气血",
        prescription: {
          treatmentPrinciple: "调理气血",
          formulaName: null,
          herbs: [],
          modifications: "",
          usage: "水煎服",
        },
      };
    }
  }

  private adjustForSafety(prescription: Prescription, violations: any[]): Prescription {
    // Remove contraindicated herbs (incompatibility, pregnancy)
    const violatingHerbNames = new Set(
      violations
        .filter(v => v.ruleType === "incompatibility" || v.ruleType === "pregnancy")
        .flatMap(v => v.involvedHerbs)
    );

    const safeHerbs = prescription.herbs.filter(herb => !violatingHerbNames.has(herb.name));

    // Adjust doses that exceed limits
    const adjustedHerbs = safeHerbs.map(herb => {
      const doseViolation = violations.find(
        (v: any) => v.ruleType === "overdose" && v.involvedHerbs.includes(herb.name)
      );

      if (doseViolation) {
        // Reduce to a safe default (10g is a conservative upper bound for most herbs)
        return { ...herb, doseGrams: Math.min(herb.doseGrams, 10) };
      }
      return herb;
    });

    return {
      ...prescription,
      herbs: adjustedHerbs,
      modifications: `${prescription.modifications}（已根据安全检查调整不安全药物）`,
    };
  }
}
