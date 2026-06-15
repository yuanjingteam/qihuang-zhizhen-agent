import { z } from "zod";

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

export type SafetyViolation = z.infer<typeof safetyViolationSchema>;
export type SafetyCheckResult = z.infer<typeof safetyCheckResultSchema>;
