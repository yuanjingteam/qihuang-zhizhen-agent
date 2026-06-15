import { Annotation } from "@langchain/langgraph";
import type { Patient, DiagnosisResult, Prescription, SafetyCheckResult } from "../core/models";

/**
 * GraphState — shared state for the LangGraph workflow
 *
 * This is the contract between all agents in the system.
 */
export const GraphState = Annotation.Root({
  // Input
  patient: Annotation<Patient>,
  outputRole: Annotation<"2B" | "2C">,

  // Triage
  isEmergency: Annotation<boolean>,
  emergencyReason: Annotation<string | null>,

  // Inquiry
  inquiryTurn: Annotation<number>,
  inquiryQuestions: Annotation<string[]>,
  patientResponses: Annotation<string[]>,
  informationGain: Annotation<number>,

  // Diagnosis
  diagnosisResults: Annotation<DiagnosisResult[]>,
  ragEvidence: Annotation<unknown[]>,
  diagnosisReasoning: Annotation<string>,

  // Reflection / Evidence Verification
  evidenceMatchScore: Annotation<number>,
  evidenceGaps: Annotation<string[]>,

  // Conflict Detection
  hasConflict: Annotation<boolean>,
  conflictDetails: Annotation<string[]>,
  reDiagnosisCount: Annotation<number>,

  // Safety Check (independent node in graph)
  safetyCheckCount: Annotation<number>,

  // Treatment
  treatmentPrinciple: Annotation<string>,
  prescription: Annotation<Prescription | null>,
  safetyResult: Annotation<SafetyCheckResult | null>,

  // Output
  finalOutput: Annotation<string>,
  soapNote: Annotation<string | null>,
  sseEvents: Annotation<Record<string, unknown>[]>,

  // Trace
  trace: Annotation<unknown[]>,
});

export type GraphStateType = typeof GraphState.State;
