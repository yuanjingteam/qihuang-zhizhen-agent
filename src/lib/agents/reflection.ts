import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";

/**
 * Evidence Verification Agent (反思Agent)
 *
 * Match diagnosis against original symptoms using LLM + heuristic fallback.
 * Returns honest score — low scores will trigger re-inquiry via Graph edge.
 */

export class EvidenceVerificationAgent extends BaseAgent {
  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, diagnosisResults } = state;

    if (!diagnosisResults || diagnosisResults.length === 0) {
      return {
        evidenceMatchScore: 0,
        evidenceGaps: ["无诊断结果"],
      };
    }

    // Try LLM-based verification first
    try {
      return await this.llmVerify(state);
    } catch {
      // Fallback to heuristic
      return this.heuristicVerify(state);
    }
  }

  private async llmVerify(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient, diagnosisResults } = state;
    const diagnosis = diagnosisResults[0];

    const result = await this.callLLM([
      {
        role: "system",
        content: `你是一个中医诊断验证AI。验证诊断结论是否与患者症状匹配。
返回JSON格式：{"score": 0.0-1.0, "gaps": ["不匹配点1", "不匹配点2"]}
score 评判标准：
- 0.8+：证据充分，症状与证型高度吻合
- 0.6-0.8：基本匹配，但有小部分症状未被解释
- 0.4-0.6：部分匹配，有明显证据缺口
- <0.4：匹配度低，诊断依据不足`,
      },
      {
        role: "user",
        content: `患者主诉：${patient.chiefComplaint}
患者症状：${patient.symptoms.join("、")}
诊断结论：${JSON.stringify(diagnosis.topKSyndromes.map(s => ({ name: s.name, evidence: s.evidence })))}
推理过程：${state.diagnosisReasoning}`,
      },
    ]);

    try {
      const parsed = JSON.parse(result);
      return {
        evidenceMatchScore: Math.min(Math.max(Number(parsed.score) || 0, 0), 1),
        evidenceGaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
      };
    } catch {
      return this.heuristicVerify(state);
    }
  }

  private heuristicVerify(state: GraphStateType): Partial<GraphStateType> {
    const { patient, diagnosisResults } = state;
    const diagnosis = diagnosisResults[0];
    const patientSymptoms = [patient.chiefComplaint, ...patient.symptoms].filter(Boolean);

    let totalMatch = 0;
    const gaps: string[] = [];

    for (const syndrome of diagnosis.topKSyndromes) {
      const syndromeEvidence = syndrome.evidence || [];
      const matchedEvidence = syndromeEvidence.filter(e =>
        patientSymptoms.some(s => s.includes(e) || e.includes(s))
      );

      if (matchedEvidence.length === 0) {
        gaps.push(`${syndrome.name}：无匹配症状支持`);
      } else {
        totalMatch += matchedEvidence.length / Math.max(syndromeEvidence.length, 1);
      }
    }

    const matchScore = diagnosis.topKSyndromes.length > 0
      ? totalMatch / diagnosis.topKSyndromes.length
      : 0;

    return {
      evidenceMatchScore: matchScore,
      evidenceGaps: gaps,
    };
  }
}
