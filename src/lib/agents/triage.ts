import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";

/**
 * Emergency Triage Agent
 *
 * Red flag symptom screening. Absolute first node.
 * Uses hardcoded red flags only (no LLM call for speed).
 */

const RED_FLAGS = [
  "胸痛",
  "呼吸困难",
  "意识丧失",
  "剧烈头痛",
  "肢体瘫痪",
  "大量出血",
  "高热不退",
  "抽搐",
  "瞳孔不等大",
  "口角歪斜",
  "语言障碍",
  "咯血",
  "呕血",
  "柏油样便",
  "休克",
  "昏迷",
  "心梗",
  "中风",
];

export class TriageAgent extends BaseAgent {
  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient } = state;
    const symptoms = [patient.chiefComplaint, ...patient.symptoms].join(" ");

    // Check hardcoded red flags only (no LLM for speed)
    const matchedFlags = RED_FLAGS.filter(flag => symptoms.includes(flag));

    if (matchedFlags.length > 0) {
      return {
        isEmergency: true,
        emergencyReason: `检测到红旗症状：${matchedFlags.join("、")}。请立即就医。`,
      };
    }

    return {
      isEmergency: false,
      emergencyReason: null,
    };
  }
}
