export enum DiagnosisConfidence {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INSUFFICIENT = "insufficient",
}

export enum OutputRole {
  PATIENT_2C = "2C",
  DOCTOR_2B = "2B",
}

export enum AgentState {
  TRIAGE = "triage",
  INQUIRY = "inquiry",
  DIAGNOSIS = "diagnosis",
  EVIDENCE_VERIFY = "evidence_verify",
  CONFLICT_DETECT = "conflict_detect",
  TREATMENT = "treatment",
  SAFETY = "safety",
  OUTPUT = "output",
}

export enum TriageResult {
  EMERGENCY = "emergency",
  NON_EMERGENCY = "non_emergency",
}

export enum InquiryStatus {
  NEED_MORE_INFO = "need_more_info",
  SUFFICIENT = "sufficient",
  DEGRADED = "degraded",
}

export enum ConflictStatus {
  NO_CONFLICT = "no_conflict",
  CONFLICT_FOUND = "conflict_found",
  MAX_RETRIES_REACHED = "max_retries_reached",
}

export enum SafetyStatus {
  PASSED = "passed",
  VIOLATIONS_FOUND = "violations_found",
}

export enum KnowledgeLayer {
  CLINICAL_GUIDELINES = 1,
  MODERN_TEXTBOOKS = 2,
  FAMOUS_DOCTOR = 3,
  CLASSICAL_TEXTS = 4,
}

export enum ConstitutionType {
  BALANCED = "平和质",
  QI_DEFICIENCY = "气虚质",
  YANG_DEFICIENCY = "阳虚质",
  YIN_DEFICIENCY = "阴虚质",
  PHLEGM_DAMPNESS = "痰湿质",
  DAMP_HEAT = "湿热质",
  BLOOD_STASIS = "血瘀质",
  QI_STAGNATION = "气郁质",
  INHERITED = "特禀质",
}

/** SSE event types emitted by GraphRunner */
export enum SSEEventType {
  START = "start",
  END = "end",
  STAGE_START = "stage_start",
  STAGE_COMPLETE = "stage_complete",
  TRIAGE_RESULT = "triage_result",
  INQUIRY_QUESTIONS = "inquiry_questions",
  DIAGNOSIS_SYNDROMES = "diagnosis_syndromes",
  REASONING_CHAIN = "reasoning_chain",
  TREATMENT = "treatment",
  SAFETY_CHECK = "safety_check",
  CONFLICT_DETECTED = "conflict_detected",
  FINAL_OUTPUT = "final_output",
  EMERGENCY = "emergency",
  ERROR = "error",
}

/** Maps SSE event types to pipeline stage IDs */
export const EVENT_TO_STAGE: Record<string, AgentState> = {
  [SSEEventType.START]: AgentState.TRIAGE,
  [SSEEventType.TRIAGE_RESULT]: AgentState.TRIAGE,
  [SSEEventType.INQUIRY_QUESTIONS]: AgentState.INQUIRY,
  [SSEEventType.DIAGNOSIS_SYNDROMES]: AgentState.DIAGNOSIS,
  [SSEEventType.REASONING_CHAIN]: AgentState.DIAGNOSIS,
  [SSEEventType.TREATMENT]: AgentState.TREATMENT,
  [SSEEventType.SAFETY_CHECK]: AgentState.SAFETY,
  [SSEEventType.CONFLICT_DETECTED]: AgentState.CONFLICT_DETECT,
  [SSEEventType.FINAL_OUTPUT]: AgentState.OUTPUT,
  [SSEEventType.END]: AgentState.OUTPUT,
  [SSEEventType.EMERGENCY]: AgentState.OUTPUT,
};

/** Pipeline stage display config */
export const PIPELINE_STAGES: Array<{
  id: AgentState;
  label: string;
}> = [
  { id: AgentState.TRIAGE, label: "分诊" },
  { id: AgentState.INQUIRY, label: "问诊" },
  { id: AgentState.DIAGNOSIS, label: "辨证" },
  { id: AgentState.EVIDENCE_VERIFY, label: "验证" },
  { id: AgentState.TREATMENT, label: "开方" },
  { id: AgentState.SAFETY, label: "安全检查" },
  { id: AgentState.CONFLICT_DETECT, label: "冲突检测" },
  { id: AgentState.OUTPUT, label: "完成" },
];
