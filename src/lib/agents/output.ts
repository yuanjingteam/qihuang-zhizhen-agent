import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";

/**
 * Output Formatter Agent
 *
 * Role-based output: 2B (full prescription + SOAP) / 2C (food-medicine only)
 */

export class OutputFormatter extends BaseAgent {
  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { outputRole, patient, diagnosisResults, prescription, treatmentPrinciple, safetyResult } = state;

    if (outputRole === "2B") {
      return this.format2B(state);
    } else {
      return this.format2C(state);
    }
  }

  private async format2B(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, diagnosisResults, prescription, treatmentPrinciple, safetyResult } = state;

    const diagnosis = diagnosisResults?.[0];
    const syndromeName = diagnosis?.topKSyndromes?.[0]?.name || "待定";

    // Generate SOAP note
    const soapNote = await this.generateSOAPNote(state);

    // Format full prescription
    const prescriptionText = prescription ? this.formatPrescription(prescription) : "暂无处方";

    const output = `
## 诊断结果

**证型**：${syndromeName}

**概率分布**：
${diagnosis?.topKSyndromes?.map(s => `- ${s.name}: ${(s.probability * 100).toFixed(0)}%`).join("\n") || "暂无"}

**治法**：${treatmentPrinciple || "待定"}

## 处方

${prescriptionText}

## 安全检查

${safetyResult?.passed ? "✅ 处方安全检查通过" : `⚠️ 安全警告：${safetyResult?.violations?.map(v => v.description).join("、") || "无"}`}

## SOAP 病历

${soapNote}
`.trim();

    return {
      finalOutput: output,
      soapNote,
    };
  }

  private async format2C(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, diagnosisResults } = state;

    const diagnosis = diagnosisResults?.[0];
    const syndromeName = diagnosis?.topKSyndromes?.[0]?.name || "待定";

    // Generate dietary recommendations (food-medicine homology)
    const dietaryAdvice = await this.generateDietaryAdvice(state);

    const output = `
## 健康评估

根据您的症状分析，您的体质倾向为：**${syndromeName}**

## 药食同源膳食建议

${dietaryAdvice}

---

⚠️ **免责声明**：以上建议仅供参考，不构成医疗诊断或治疗方案。如有不适，请及时就医。
`.trim();

    return {
      finalOutput: output,
    };
  }

  private formatPrescription(prescription: any): string {
    if (!prescription.herbs || prescription.herbs.length === 0) {
      return "暂无处方";
    }

    const herbList = prescription.herbs
      .map((h: any) => `${h.name} ${h.doseGrams}g${h.processing ? `(${h.processing})` : ""}`)
      .join("\n");

    return `
**方剂**：${prescription.formulaName || "自拟方"}

**组成**：
${herbList}

**加减**：${prescription.modifications || "无"}

**用法**：${prescription.usage || "水煎服，日一剂"}
`.trim();
  }

  private async generateSOAPNote(state: GraphStateType): Promise<string> {
    const { patient, diagnosisResults, prescription, treatmentPrinciple } = state;

    const result = await this.callLLM(
      [
        {
          role: "system",
          content: `你是一个中医电子病历AI。生成标准SOAP病历格式。
          返回格式：
          S（主观）：...
          O（客观）：...
          A（评估）：...
          P（计划）：...`,
        },
        {
          role: "user",
          content: `患者：${patient.chiefComplaint}
症状：${patient.symptoms.join("、")}
诊断：${diagnosisResults?.[0]?.topKSyndromes?.[0]?.name || "待定"}
治法：${treatmentPrinciple || "待定"}`,
        },
      ],
      {} as any,
      ""
    );

    return result;
  }

  private async generateDietaryAdvice(state: GraphStateType): Promise<string> {
    const { patient, diagnosisResults } = state;

    const result = await this.callLLM(
      [
        {
          role: "system",
          content: `你是一个中医膳食顾问AI。根据体质推荐药食同源的食材和茶饮。
          注意：只推荐食材，不推荐处方药材。返回3-5条建议。`,
        },
        {
          role: "user",
          content: `体质倾向：${diagnosisResults?.[0]?.topKSyndromes?.[0]?.name || "待定"}
主诉：${patient.chiefComplaint}`,
        },
      ],
      {} as any,
      ""
    );

    return result;
  }
}
