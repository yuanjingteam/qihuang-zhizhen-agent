import { BaseAgent } from "./base";
import type { GraphStateType } from "../graph/state";
import { SafetyEngine } from "../safety/engine";

/**
 * Safety Check Agent
 *
 * Standalone node in the Graph that validates prescriptions using SafetyEngine.
 * This is deliberately separate from TreatmentAgent so the Graph can route
 * back to Treatment when safety violations are found.
 *
 * Safety rules are always hardcoded — never LLM-generated.
 */

export class SafetyCheckAgent extends BaseAgent {
  private safetyEngine = new SafetyEngine();

  async execute(state: GraphStateType): Promise<Partial<GraphStateType>> {
    const { prescription, patient } = state;

    if (!prescription || !prescription.herbs || prescription.herbs.length === 0) {
      return {
        safetyResult: { passed: true, violations: [], blocking: false },
        safetyCheckCount: (state.safetyCheckCount ?? 0) + 1,
      };
    }

    const result = this.safetyEngine.validatePrescription(prescription, patient);

    return {
      safetyResult: result,
      safetyCheckCount: (state.safetyCheckCount ?? 0) + 1,
    };
  }
}
