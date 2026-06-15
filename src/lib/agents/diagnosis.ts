import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";
import type { RAGEngine } from "../rag/engine";

/**
 * Diagnosis Agent
 *
 * Hierarchical RAG diagnosis with Top-K probability distribution.
 * Applies four-diagnosis weight restructuring.
 */

export class DiagnosisAgent extends BaseAgent {
  constructor(
    llm: any,
    tools: any,
    private ragEngine: RAGEngine
  ) {
    super(llm, tools);
  }

  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { patient } = state;

    // Step 1: Construct query from symptoms
    const query = [
      patient.chiefComplaint,
      ...patient.symptoms,
      ...(patient.questionnaireResponses ? Object.values(patient.questionnaireResponses).flat() : []),
    ].filter(Boolean).join(" ");

    // Step 2: RAG retrieval across 4 layers
    const ragResults = await this.ragEngine.query(query, {
      symptoms: patient.symptoms,
      chiefComplaint: patient.chiefComplaint,
    });

    // Step 3: LLM generates Top-K syndrome probability distribution
    const llmResult = await this.callLLM(
      [
        {
          role: "system",
          content: `你是一个中医辨证AI。根据以下症状和参考文献，输出Top-K证候概率分布。

术语规范：
- "症"指症状（symptom），如：寒热往来、头痛、口苦、失眠
- "证"指证候/证型（syndrome/pattern），如：少阳证、肝郁气滞证、心脾两虚证
- 禁止将症状直接加"证"字当作证型名，如"寒热往来证"是错误的，应为"少阳证"

返回JSON格式：{"syndromes": [{"name": "证型名", "probability": 0.0-1.0, "evidence": ["支持症状"]}], "reasoning": "推理过程"}`,
        },
        {
          role: "user",
          content: `主诉：${patient.chiefComplaint}
症状：${patient.symptoms.join("、")}
十问：${JSON.stringify(patient.questionnaireResponses)}
参考文献：${ragResults.map(r => r.chunks?.map(c => c.text).join("\n")).join("\n---\n")}`,
        },
      ],
      {} as any,
      ""
    );

    try {
      const parsed = this.parseJSON(llmResult);
      let syndromes = Array.isArray(parsed.syndromes)
        ? (parsed.syndromes as Array<{ name: string; probability: number; evidence: string[]; sourceLayer?: number }>)
          .map(s => ({ ...s, sourceLayer: s.sourceLayer ?? 1 }))
        : [];
      const reasoning = String(parsed.reasoning || "");

      // Ensure at least one syndrome exists
      if (syndromes.length === 0) {
        syndromes = this.generateFallbackSyndromes(patient);
      }

      return {
        diagnosisResults: [{
          topKSyndromes: syndromes,
          confidenceThreshold: 0.6,
          reasoningTrace: reasoning || "基于症状和文献的辨证分析",
          diagnosisWeights: {
            chief_complaint: 0.5,
            questionnaire: 0.35,
            tongue: 0.15,
          },
        }],
        ragEvidence: ragResults,
        diagnosisReasoning: reasoning || llmResult,
      };
    } catch {
      // Fallback: generate basic syndrome from symptoms
      const fallbackSyndromes = this.generateFallbackSyndromes(patient);
      return {
        diagnosisResults: [{
          topKSyndromes: fallbackSyndromes,
          confidenceThreshold: 0.6,
          reasoningTrace: "基于症状关键词的初步辨证",
          diagnosisWeights: { chief_complaint: 0.5, questionnaire: 0.35, tongue: 0.15 },
        }],
        ragEvidence: ragResults,
        diagnosisReasoning: llmResult || "基于症状关键词的初步辨证",
      };
    }
  }

  private parseJSON(text: string): Record<string, unknown> {
    // Try direct parse first
    try {
      return JSON.parse(text);
    } catch { /* continue */ }

    // Try extracting JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch { /* continue */ }
    }

    // Try finding JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch { /* continue */ }
    }

    throw new Error("No valid JSON found");
  }

  private generateFallbackSyndromes(patient: { chiefComplaint: string; symptoms: string[] }): Array<{ name: string; probability: number; evidence: string[]; sourceLayer: number }> {
    const all = [patient.chiefComplaint, ...patient.symptoms].join(" ");
    const syndromes: Array<{ name: string; probability: number; evidence: string[]; sourceLayer: number }> = [];

    if (all.includes("口苦") || all.includes("烦躁") || all.includes("易怒")) {
      syndromes.push({ name: "肝胆湿热", probability: 0.4, evidence: ["口苦", "烦躁"], sourceLayer: 1 });
    }
    if (all.includes("失眠") || all.includes("多梦")) {
      syndromes.push({ name: "心脾两虚", probability: 0.3, evidence: ["失眠", "多梦"], sourceLayer: 1 });
    }
    if (all.includes("乏力") || all.includes("气短")) {
      syndromes.push({ name: "气虚", probability: 0.3, evidence: ["乏力"], sourceLayer: 1 });
    }
    if (all.includes("头痛")) {
      syndromes.push({ name: "风寒头痛", probability: 0.3, evidence: ["头痛"], sourceLayer: 1 });
    }
    if (all.includes("怕冷") || all.includes("手脚凉")) {
      syndromes.push({ name: "阳虚", probability: 0.25, evidence: ["怕冷"], sourceLayer: 1 });
    }
    if (all.includes("怕热") || all.includes("口干")) {
      syndromes.push({ name: "阴虚火旺", probability: 0.25, evidence: ["怕热"], sourceLayer: 1 });
    }

    // Default if nothing matched
    if (syndromes.length === 0) {
      syndromes.push({ name: "气血不和", probability: 0.5, evidence: [patient.chiefComplaint], sourceLayer: 1 });
    }

    // Normalize probabilities
    const total = syndromes.reduce((s, x) => s + x.probability, 0);
    return syndromes.map(s => ({ ...s, probability: Math.round(s.probability / total * 100) / 100 }));
  }
}
