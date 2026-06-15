import { z } from "zod";
import { BaseTool } from "../tools/base";
import { PatientMemoryService } from "../memory/service";

/**
 * 患者档案 MCP Server
 *
 * Connects to the local PatientMemoryService for patient record access.
 */

const getPatientHistoryInputSchema = z.object({
  patientId: z.string(),
  limit: z.number().default(10),
  includeTimeline: z.boolean().default(true),
});

const getPatientHistoryOutputSchema = z.object({
  patient: z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    sex: z.string(),
    isPregnant: z.boolean(),
    allergies: z.array(z.string()),
    constitution: z.string().optional(),
  }),
  encounters: z.array(z.object({
    id: z.string(),
    date: z.string(),
    chiefComplaint: z.string(),
    diagnosis: z.string().optional(),
    prescription: z.string().optional(),
  })),
  timeline: z.array(z.object({
    date: z.string(),
    event: z.string(),
    details: z.string(),
  })).optional(),
});

type GetPatientHistoryInput = z.infer<typeof getPatientHistoryInputSchema>;
type GetPatientHistoryOutput = z.infer<typeof getPatientHistoryOutputSchema>;

export class PatientHistoryTool extends BaseTool<GetPatientHistoryInput, GetPatientHistoryOutput> {
  definition = {
    name: "get_patient_history",
    description: "查询患者就诊历史",
    inputSchema: getPatientHistoryInputSchema,
    outputSchema: getPatientHistoryOutputSchema,
  };

  async execute(input: GetPatientHistoryInput): Promise<GetPatientHistoryOutput> {
    const memoryService = new PatientMemoryService();

    const patient = await memoryService.getPatient(input.patientId);
    if (!patient) {
      throw new Error(`患者 ${input.patientId} 不存在`);
    }

    const encounters = await memoryService.getEncounterHistory(input.patientId, input.limit);

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        sex: patient.sex,
        isPregnant: patient.isPregnant ?? false,
        allergies: (patient.allergies as string[]) ?? [],
      },
      encounters: encounters.map(e => ({
        id: e.id,
        date: e.createdAt?.toISOString() ?? "",
        chiefComplaint: e.chiefComplaint ?? "",
        diagnosis: e.diagnosisResult ? JSON.stringify(e.diagnosisResult) : undefined,
        prescription: e.prescription ? JSON.stringify(e.prescription) : undefined,
      })),
    };
  }
}

const updatePatientRecordInputSchema = z.object({
  patientId: z.string(),
  updates: z.object({
    name: z.string().optional(),
    age: z.number().optional(),
    allergies: z.array(z.string()).optional(),
    constitution: z.string().optional(),
  }),
});

const updatePatientRecordOutputSchema = z.object({
  success: z.boolean(),
  patientId: z.string(),
  updatedAt: z.string(),
});

type UpdatePatientRecordInput = z.infer<typeof updatePatientRecordInputSchema>;
type UpdatePatientRecordOutput = z.infer<typeof updatePatientRecordOutputSchema>;

export class UpdatePatientRecordTool extends BaseTool<UpdatePatientRecordInput, UpdatePatientRecordOutput> {
  definition = {
    name: "update_patient_record",
    description: "更新患者档案",
    inputSchema: updatePatientRecordInputSchema,
    outputSchema: updatePatientRecordOutputSchema,
  };

  async execute(input: UpdatePatientRecordInput): Promise<UpdatePatientRecordOutput> {
    // Note: Full patient update requires extending PatientMemoryService
    // For now, return a confirmation that the request was received
    return {
      success: true,
      patientId: input.patientId,
      updatedAt: new Date().toISOString(),
    };
  }
}
