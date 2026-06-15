import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState } from "./state";
import type { GraphStateType } from "./state";
import { TriageAgent } from "../agents/triage";
import { InquiryAgent } from "../agents/inquiry";
import { DiagnosisAgent } from "../agents/diagnosis";
import { EvidenceVerificationAgent } from "../agents/reflection";
import { ConflictDetectionAgent } from "../agents/conflict";
import { TreatmentAgent } from "../agents/treatment";
import { SafetyCheckAgent } from "../agents/safety";
import { OutputFormatter } from "../agents/output";
import type { BaseAgent } from "../agents/base";
import type { LLMAdapter } from "../llm/adapter";
import type { RAGEngine } from "../rag/engine";
import type { ToolRegistry } from "../tools/registry";

/**
 * GraphBuilder — constructs the LangGraph state machine
 *
 * Workflow:
 * START → Triage → (emergency? → Output) → Inquiry (loop ≤2) → Diagnosis →
 * EvidenceVerify (fail? → Inquiry) → Treatment → SafetyCheck (fail? → Treatment, ≤2) →
 * ConflictDetect (conflict? → Diagnosis, ≤2) → Output → END
 */

export class GraphBuilder {
  private agents: Map<string, BaseAgent>;

  constructor(
    llm: LLMAdapter,
    ragEngine: RAGEngine,
    tools?: ToolRegistry
  ) {
    this.agents = new Map();
    this.agents.set("triage", new TriageAgent(llm, tools));
    this.agents.set("inquiry", new InquiryAgent(llm, tools));
    this.agents.set("diagnosis", new DiagnosisAgent(llm, tools, ragEngine));
    this.agents.set("evidenceVerify", new EvidenceVerificationAgent(llm, tools));
    this.agents.set("treatment", new TreatmentAgent(llm, tools));
    this.agents.set("safetyCheck", new SafetyCheckAgent(llm, tools));
    this.agents.set("conflictDetect", new ConflictDetectionAgent(llm, tools));
    this.agents.set("output", new OutputFormatter(llm, tools));
  }

  build() {
    const graph = new StateGraph(GraphState)
      // Add nodes
      .addNode("triage", async (state) => {
        const agent = this.agents.get("triage")!;
        return agent.execute(state);
      })
      .addNode("inquiry", async (state) => {
        const agent = this.agents.get("inquiry")!;
        return agent.execute(state);
      })
      .addNode("diagnosis", async (state) => {
        const agent = this.agents.get("diagnosis")!;
        return agent.execute(state);
      })
      .addNode("evidenceVerify", async (state) => {
        const agent = this.agents.get("evidenceVerify")!;
        return agent.execute(state);
      })
      .addNode("treatment", async (state) => {
        const agent = this.agents.get("treatment")!;
        return agent.execute(state);
      })
      .addNode("safetyCheck", async (state) => {
        const agent = this.agents.get("safetyCheck")!;
        return agent.execute(state);
      })
      .addNode("conflictDetect", async (state) => {
        const agent = this.agents.get("conflictDetect")!;
        return agent.execute(state);
      })
      .addNode("output", async (state) => {
        const agent = this.agents.get("output")!;
        return agent.execute(state);
      })

      // Add edges
      .addEdge(START, "triage")
      .addConditionalEdges("triage", this.triageEdge)
      .addConditionalEdges("inquiry", this.inquiryEdge)
      .addEdge("diagnosis", "evidenceVerify")
      .addConditionalEdges("evidenceVerify", this.evidenceEdge)
      .addEdge("treatment", "safetyCheck")
      .addConditionalEdges("safetyCheck", this.safetyEdge)
      .addConditionalEdges("conflictDetect", this.conflictEdge)
      .addEdge("output", END);

    return graph.compile();
  }

  private triageEdge(state: GraphStateType): string {
    if (state.isEmergency) {
      return "output";
    }
    // Skip inquiry if responses already provided (two-phase interactive flow)
    if (state.patientResponses && state.patientResponses.length > 0) {
      return "diagnosis";
    }
    return "inquiry";
  }

  private inquiryEdge(state: GraphStateType): string {
    // In non-interactive mode (no user responses), stop after first inquiry
    if (!state.patientResponses || state.patientResponses.length === 0) {
      if (state.inquiryTurn >= 1) {
        return "diagnosis";
      }
    }
    if (state.inquiryTurn >= 2 || state.informationGain >= 0.8) {
      return "diagnosis";
    }
    if (state.inquiryQuestions && state.inquiryQuestions.length > 0) {
      return "inquiry";
    }
    return "diagnosis";
  }

  private evidenceEdge(state: GraphStateType): string {
    if (state.evidenceMatchScore < 0.6 && state.inquiryTurn < 2) {
      return "inquiry";
    }
    return "treatment";
  }

  /**
   * Safety check edge: if safety violations found and we haven't retried too
   * many times, route back to Treatment for adjustment. Otherwise proceed.
   */
  private safetyEdge(state: GraphStateType): string {
    if (
      state.safetyResult &&
      !state.safetyResult.passed &&
      (state.safetyCheckCount ?? 0) < 2
    ) {
      return "treatment";
    }
    return "conflictDetect";
  }

  private conflictEdge(state: GraphStateType): string {
    if (state.hasConflict && state.reDiagnosisCount < 2) {
      return "diagnosis";
    }
    return "output";
  }
}
