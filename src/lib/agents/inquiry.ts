import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";

/**
 * Inquiry Agent
 *
 * Information-gain-driven inquiry using LLM.
 * Generates targeted questions based on missing diagnostic elements.
 * Falls back to heuristic questions if LLM is unavailable.
 */

export class InquiryAgent extends BaseAgent {
  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, inquiryTurn, inquiryQuestions } = state;

    // Already have questions for this turn — don't regenerate
    if (inquiryQuestions && inquiryQuestions.length > 0) {
      return {
        inquiryTurn: inquiryTurn + 1,
        inquiryQuestions: [],
        informationGain: 0,
      };
    }

    if (inquiryTurn >= 2) {
      return {
        inquiryTurn: inquiryTurn + 1,
        inquiryQuestions: [],
        informationGain: 0,
      };
    }

    // Try LLM-based inquiry first
    try {
      return await this.llmInquiry(state);
    } catch {
      // Fallback to heuristic
      return this.heuristicInquiry(state);
    }
  }

  private async llmInquiry(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, inquiryTurn, patientResponses } = state;

    const previousQA = patientResponses && patientResponses.length > 0
      ? `已回答：${patientResponses.join("；")}`
      : "暂无之前的问诊回答";

    const result = await this.callLLM([
      {
        role: "system",
        content: `你是一个中医问诊AI。根据已有信息，生成2-3个针对性问题以获取更多诊断信息。
重点围绕十问歌未覆盖的方面：寒热、汗出、头身、二便、饮食、胸腹、耳聋、口渴、旧病、病因。
只问尚未了解的信息，不重复已有内容。
返回JSON格式：{"questions": ["问题1", "问题2", "问题3"], "informationGain": 0.0-1.0}
informationGain 表示当前信息对辨证的充分程度（0=完全不足, 1=已充分）。`,
      },
      {
        role: "user",
        content: `主诉：${patient.chiefComplaint}
已知症状：${patient.symptoms.join("、")}
${previousQA}
问诊轮次：${inquiryTurn + 1}/2`,
      },
    ]);

    try {
      const parsed = this.parseJSON(result);
      const questions: string[] = Array.isArray(parsed.questions)
        ? parsed.questions.map(String).slice(0, 3)
        : [];
      const informationGain = Math.min(Math.max(Number(parsed.informationGain) || 0, 0), 1);

      return {
        inquiryTurn: inquiryTurn + 1,
        inquiryQuestions: questions.length > 0 ? questions : this.heuristicInquiry(state).inquiryQuestions as string[],
        informationGain,
      };
    } catch {
      return this.heuristicInquiry(state);
    }
  }

  private parseJSON(text: string): Record<string, unknown> {
    try { return JSON.parse(text); } catch { /* continue */ }
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) { try { return JSON.parse(jsonMatch[1].trim()); } catch { /* continue */ } }
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) { try { return JSON.parse(objectMatch[0]); } catch { /* continue */ } }
    throw new Error("No valid JSON found");
  }

  private heuristicInquiry(state: GraphStateType): Partial<GraphStateType> {
    const { patient, inquiryTurn } = state;
    const allSymptoms = [patient.chiefComplaint, ...patient.symptoms].join(" ");
    const questions: string[] = [];

    // 十问歌 checklist: 寒热、汗、头身、二便、饮食、胸腹、耳聋、口渴、旧病、病因
    if (!allSymptoms.includes("寒") && !allSymptoms.includes("热") && !allSymptoms.includes("怕冷") && !allSymptoms.includes("怕热")) {
      questions.push("请问您平时是怕冷还是怕热？");
    }
    if (!allSymptoms.includes("汗") && !allSymptoms.includes("出汗")) {
      questions.push("出汗情况如何（正常/容易出汗/盗汗/无汗）？");
    }
    if (!allSymptoms.includes("便") && !allSymptoms.includes("大便") && !allSymptoms.includes("小便")) {
      questions.push("二便情况如何（大便干结/溏稀/正常，小便黄/清/正常）？");
    }
    if (!allSymptoms.includes("眠") && !allSymptoms.includes("睡")) {
      questions.push("睡眠质量怎么样？是否有失眠、多梦？");
    }
    if (!allSymptoms.includes("饮") && !allSymptoms.includes("食") && !allSymptoms.includes("胃口")) {
      questions.push("饮食情况如何（食欲/口味偏好/口渴与否）？");
    }

    return {
      inquiryTurn: inquiryTurn + 1,
      inquiryQuestions: questions.slice(0, 3),
      informationGain: 0.3,
    };
  }
}
