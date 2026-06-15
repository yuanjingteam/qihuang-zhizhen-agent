import { z } from "zod";

export const syndromeSchema = z.object({
  name: z.string(),
  probability: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  sourceLayer: z.number(),
});

export const herbSchema = z.object({
  name: z.string(),
  pinyin: z.string(),
  doseGrams: z.number(),
  processing: z.string().nullable(),
  role: z.enum(["君", "臣", "佐", "使"]),
});

export const prescriptionSchema = z.object({
  treatmentPrinciple: z.string(),
  formulaName: z.string().nullable(),
  herbs: z.array(herbSchema),
  modifications: z.string(),
  usage: z.string(),
});

export const patientSchema = z.object({
  patientId: z.string(),
  age: z.number(),
  sex: z.enum(["男", "女"]),
  isPregnant: z.boolean().default(false),
  allergies: z.array(z.string()).default([]),
  chiefComplaint: z.string(),
  symptoms: z.array(z.string()),
  tongueImagePath: z.string().nullable().default(null),
  questionnaireResponses: z.record(z.unknown()).nullable().default(null),
});

export const diagnosisResultSchema = z.object({
  topKSyndromes: z.array(syndromeSchema),
  confidenceThreshold: z.number(),
  reasoningTrace: z.string(),
  diagnosisWeights: z.record(z.number()),
});

export const safetyViolationSchema = z.object({
  ruleType: z.enum(["incompatibility", "fear", "overdose", "pregnancy"]),
  description: z.string(),
  severity: z.enum(["critical", "warning"]),
  involvedHerbs: z.array(z.string()),
});

export const safetyCheckResultSchema = z.object({
  passed: z.boolean(),
  violations: z.array(safetyViolationSchema),
  blocking: z.boolean(),
});

export type Syndrome = z.infer<typeof syndromeSchema>;
export type Herb = z.infer<typeof herbSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type Patient = z.infer<typeof patientSchema>;
export type DiagnosisResult = z.infer<typeof diagnosisResultSchema>;
export type SafetyViolation = z.infer<typeof safetyViolationSchema>;
export type SafetyCheckResult = z.infer<typeof safetyCheckResultSchema>;
