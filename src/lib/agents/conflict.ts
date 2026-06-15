import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";
import { SafetyEngine } from "../safety/engine";

/**
 * Conflict Detection Agent
 *
 * Checks prescription for therapeutic conflicts:
 * 1. Eighteen Incompatibilities (十八反) — always checked via SafetyEngine
 * 2. Nineteen Fears (十九畏) — always checked via SafetyEngine
 * 3. Hot-cold contradiction in formula — LLM + heuristic
 *
 * Returns honest hasConflict flag so the Graph can route back to Diagnosis.
 */

export class ConflictDetectionAgent extends BaseAgent {
  private safetyEngine = new SafetyEngine();

  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { prescription, treatmentPrinciple } = state;

    if (!prescription || !prescription.herbs || prescription.herbs.length === 0) {
      return {
        hasConflict: false,
        conflictDetails: [],
      };
    }

    const herbNames = prescription.herbs.map(h => h.name);
    const conflicts: string[] = [];

    // 1. Check 十八反 via SafetyEngine (hardcoded, no LLM)
    const incompatViolations = this.safetyEngine.checkIncompatibilities(herbNames);
    for (const v of incompatViolations) {
      conflicts.push(v.description);
    }

    // 2. Check 十九畏 via SafetyEngine (hardcoded, no LLM)
    const fearViolations = this.safetyEngine.checkFears(herbNames);
    for (const v of fearViolations) {
      conflicts.push(v.description);
    }

    // 3. Heuristic: hot-cold contradiction
    const hotHerbs = ["附子", "干姜", "肉桂", "吴茱萸", "花椒", "桂枝", "细辛", "高良姜"];
    const coldHerbs = ["黄连", "黄芩", "黄柏", "石膏", "知母", "栀子", "金银花", "连翘"];

    const hasHot = prescription.herbs.some(h => hotHerbs.includes(h.name));
    const hasCold = prescription.herbs.some(h => coldHerbs.includes(h.name));

    if (hasHot && hasCold) {
      // Cold-hot co-use is sometimes intentional (e.g. 半夏泻心汤), flag as soft conflict
      conflicts.push("方中寒热药物并用，请确认配伍合理性");
    }

    // 4. LLM-based: check if treatment principle contradicts formula nature
    try {
      const llmConflicts = await this.llmCheckConflicts(state, conflicts);
      return llmConflicts;
    } catch {
      // Fallback: use heuristic results only
      return {
        hasConflict: conflicts.length > 0,
        conflictDetails: conflicts,
      };
    }
  }

  private async llmCheckConflicts(
    state: GraphStateType,
    heuristicConflicts: string[]
  ): Promise<Partial<GraphStateType>> {
    const { prescription, treatmentPrinciple } = state;

    const result = await this.callLLM([
      {
        role: "system",
        content: `你是一个中医处方审核AI。检查治法与方剂是否矛盾。
返回JSON格式：{"conflict": boolean, "details": ["矛盾1", "矛盾2"]}
只检查以下冲突类型：
1. 治法与方剂功效是否一致（如治法是"温阳"但方剂偏寒凉）
2. 药物配伍是否存在明显禁忌（寒热错杂需注明是否为故意配伍）
不要将"寒热并用"的经方标记为冲突。`,
      },
      {
        role: "user",
        content: `治法：${treatmentPrinciple}
方剂：${prescription!.formulaName || "自拟方"}
药物：${prescription!.herbs.map(h => `${h.name} ${h.doseGrams}g`).join("、")}`,
      },
    ]);

    try {
      const parsed = JSON.parse(result);
      const llmConflicts: string[] = Array.isArray(parsed.details) ? parsed.details.map(String) : [];
      const allConflicts = [...heuristicConflicts, ...llmConflicts];

      return {
        hasConflict: allConflicts.length > 0,
        conflictDetails: allConflicts,
      };
    } catch {
      return {
        hasConflict: heuristicConflicts.length > 0,
        conflictDetails: heuristicConflicts,
      };
    }
  }
}
