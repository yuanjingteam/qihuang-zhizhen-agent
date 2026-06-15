import { GraphBuilder } from "./builder";
import type { GraphStateType } from "./state";
import { TraceCollector } from "./trace";
import type { Patient } from "../core/models";
import type { LLMAdapter } from "../llm/adapter";
import type { RAGEngine } from "../rag/engine";
import type { ToolRegistry } from "../tools/registry";
import { TriageAgent } from "../agents/triage";
import { InquiryAgent } from "../agents/inquiry";

export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export interface InquiryResult {
  sessionId: string;
  questions: string[];
  turn: number;
  triageResult: { isEmergency: boolean; reason: string | null };
}

// Pipeline stages for progress tracking
const PIPELINE_STAGES = [
  { id: "triage", label: "分诊", icon: "shield" },
  { id: "inquiry", label: "问诊", icon: "message" },
  { id: "diagnosis", label: "辨证", icon: "brain" },
  { id: "evidenceVerify", label: "验证", icon: "check" },
  { id: "treatment", label: "开方", icon: "pill" },
  { id: "safetyCheck", label: "安全检查", icon: "shield" },
  { id: "conflictDetect", label: "冲突检测", icon: "alert" },
  { id: "output", label: "完成", icon: "done" },
] as const;

const DIAGNOSIS_STAGES = [
  { id: "diagnosis", label: "辨证", icon: "brain" },
  { id: "evidenceVerify", label: "验证", icon: "check" },
  { id: "treatment", label: "开方", icon: "pill" },
  { id: "safetyCheck", label: "安全检查", icon: "shield" },
  { id: "conflictDetect", label: "冲突检测", icon: "alert" },
  { id: "output", label: "完成", icon: "done" },
] as const;

/**
 * GraphRunner — executes the LangGraph workflow with SSE streaming
 */
export class GraphRunner {
  private graph: ReturnType<GraphBuilder["build"]>;
  private llm: LLMAdapter;
  private tools?: ToolRegistry;

  constructor(
    llm: LLMAdapter,
    ragEngine: RAGEngine,
    tools?: ToolRegistry
  ) {
    this.llm = llm;
    this.tools = tools;
    const builder = new GraphBuilder(llm, ragEngine, tools);
    this.graph = builder.build();
  }

  /**
   * Phase 1: Run triage + inquiry only, return questions for interactive UI
   */
  async runInquiryPhase(patient: Patient): Promise<InquiryResult> {
    const sessionId = crypto.randomUUID();
    const initialState = this.buildInitialState(patient, "2C");

    // Run triage
    const triageAgent = new TriageAgent(this.llm, this.tools);
    const triageResult = await triageAgent.execute(initialState as GraphStateType);

    if (triageResult.isEmergency) {
      return {
        sessionId,
        questions: [],
        turn: 0,
        triageResult: { isEmergency: true, reason: triageResult.emergencyReason as string },
      };
    }

    // Run inquiry
    const stateAfterTriage = { ...initialState, ...triageResult } as GraphStateType;
    const inquiryAgent = new InquiryAgent(this.llm, this.tools);
    const inquiryResult = await inquiryAgent.execute(stateAfterTriage);

    return {
      sessionId,
      questions: (inquiryResult.inquiryQuestions as string[]) ?? [],
      turn: (inquiryResult.inquiryTurn as number) ?? 1,
      triageResult: { isEmergency: false, reason: null },
    };
  }

  /**
   * Build initial state from patient input
   */
  private buildInitialState(patient: Patient, role: "2B" | "2C"): Partial<GraphStateType> {
    return {
      patient,
      outputRole: role,
      isEmergency: false,
      emergencyReason: null,
      inquiryTurn: 0,
      inquiryQuestions: [],
      patientResponses: [],
      informationGain: 0,
      diagnosisResults: [],
      ragEvidence: [],
      diagnosisReasoning: "",
      evidenceMatchScore: 0,
      evidenceGaps: [],
      hasConflict: false,
      conflictDetails: [],
      reDiagnosisCount: 0,
      safetyCheckCount: 0,
      treatmentPrinciple: "",
      prescription: null,
      safetyResult: null,
      finalOutput: "",
      soapNote: null,
      sseEvents: [],
      trace: [],
    };
  }

  /**
   * Execute graph synchronously
   */
  async run(patient: Patient, role: "2B" | "2C"): Promise<GraphStateType> {
    const initialState = this.buildInitialState(patient, role);
    const result = await this.graph.invoke(initialState, { recursionLimit: 50 });
    return result as GraphStateType;
  }

  /**
   * Execute graph with SSE event streaming — yields events as each node completes.
   * If inquiryResponses are provided, they are injected into the initial state.
   */
  async *runStream(
    patient: Patient,
    role: "2B" | "2C",
    inquiryResponses?: string[]
  ): AsyncGenerator<SSEEvent> {
    const trace = new TraceCollector();

    // Emit start event with pipeline definition
    const hasResponses = inquiryResponses && inquiryResponses.length > 0;
    yield {
      event: "start",
      data: {
        patient: patient.chiefComplaint,
        role,
        timestamp: new Date().toISOString(),
        stages: (hasResponses ? DIAGNOSIS_STAGES : PIPELINE_STAGES).map(s => ({ id: s.id, label: s.label })),
      },
    };

    try {
      const initialState = this.buildInitialState(patient, role);
      // Inject inquiry responses if provided
      if (hasResponses) {
        initialState.patientResponses = inquiryResponses;
        initialState.inquiryTurn = 1; // Mark as already inquired
      }
      let lastState: GraphStateType | null = null;
      let previousNode: string | null = null;

      // Use graph.stream() for step-by-step execution
      const stream = await this.graph.stream(initialState, { recursionLimit: 50 });

      for await (const chunk of stream) {
        // chunk is { nodeName: stateUpdate }
        for (const [nodeName, stateUpdate] of Object.entries(chunk as Record<string, Record<string, unknown>>)) {
          lastState = { ...(lastState as Record<string, unknown>), ...stateUpdate } as GraphStateType;

          // Emit stage_complete for the previous node
          if (previousNode) {
            yield {
              event: "stage_complete",
              data: { stage: previousNode },
            };
          }

          // Emit stage_start for current node
          yield {
            event: "stage_start",
            data: { stage: nodeName },
          };

          // Emit node-specific events
          yield* this.emitNodeEvents(nodeName, lastState, role);

          previousNode = nodeName;
        }
      }

      // Complete the last stage
      if (previousNode) {
        yield {
          event: "stage_complete",
          data: { stage: previousNode },
        };
      }

      // Emit final output from the last state
      if (lastState) {
        yield {
          event: "final_output",
          data: {
            content: lastState.finalOutput,
            role,
            soapNote: lastState.soapNote,
          },
        };
      }

    } catch (error) {
      yield {
        event: "error",
        data: { message: String(error), recoverable: false },
      };
    }

    yield {
      event: "end",
      data: { timestamp: new Date().toISOString() },
    };
  }

  /**
   * Emit specific events based on which node just completed
   */
  private *emitNodeEvents(nodeName: string, state: GraphStateType, role: "2B" | "2C"): Generator<SSEEvent> {
    switch (nodeName) {
      case "triage":
        yield {
          event: "triage_result",
          data: { isEmergency: state.isEmergency, reason: state.emergencyReason },
        };
        if (state.isEmergency) {
          yield {
            event: "emergency",
            data: { message: state.emergencyReason },
          };
        }
        break;

      case "inquiry":
        if (state.inquiryQuestions && state.inquiryQuestions.length > 0) {
          yield {
            event: "inquiry_questions",
            data: { questions: state.inquiryQuestions, turn: state.inquiryTurn },
          };
        }
        break;

      case "diagnosis": {
        const syndromes = state.diagnosisResults?.[0]?.topKSyndromes;
        if (syndromes && syndromes.length > 0) {
          yield {
            event: "diagnosis_syndromes",
            data: {
              syndromes: syndromes.map(s => ({
                name: s.name,
                probability: s.probability,
                evidence: s.evidence,
              })),
            },
          };
        } else {
          // Fallback: generate basic syndromes from patient symptoms
          const all = [state.patient.chiefComplaint, ...state.patient.symptoms].join(" ");
          const fallback: Array<{ name: string; probability: number; evidence: string[] }> = [];
          if (all.includes("咳")) fallback.push({ name: "风寒犯肺", probability: 0.5, evidence: ["咳嗽"] });
          if (all.includes("失眠") || all.includes("多梦")) fallback.push({ name: "心脾两虚", probability: 0.3, evidence: ["失眠"] });
          if (all.includes("乏力")) fallback.push({ name: "气虚", probability: 0.3, evidence: ["乏力"] });
          if (fallback.length === 0) fallback.push({ name: "气血不和", probability: 0.5, evidence: [state.patient.chiefComplaint] });
          const total = fallback.reduce((s, x) => s + x.probability, 0);
          yield {
            event: "diagnosis_syndromes",
            data: {
              syndromes: fallback.map(s => ({ ...s, probability: Math.round(s.probability / total * 100) / 100 })),
            },
          };
        }
        yield {
          event: "reasoning_chain",
          data: {
            diagnosisReasoning: state.diagnosisReasoning,
            evidenceMatchScore: state.evidenceMatchScore,
          },
        };
        break;
      }

      case "treatment":
        if (state.prescription) {
          yield {
            event: "treatment",
            data: {
              principle: state.treatmentPrinciple,
              formula: state.prescription.formulaName,
              herbs: state.prescription.herbs.map(h => ({
                name: h.name,
                dose: h.doseGrams,
                processing: h.processing,
              })),
            },
          };
        }
        break;

      case "safetyCheck":
        if (state.safetyResult) {
          yield {
            event: "safety_check",
            data: {
              passed: state.safetyResult.passed,
              violations: state.safetyResult.violations.map(v => ({
                type: v.ruleType,
                description: v.description,
                severity: v.severity,
              })),
            },
          };
        }
        break;

      case "conflictDetect":
        if (state.conflictDetails && state.conflictDetails.length > 0) {
          yield {
            event: "conflict_detected",
            data: {
              hasConflict: state.hasConflict,
              details: state.conflictDetails,
            },
          };
        }
        break;

      case "output":
        break;
    }
  }
}
