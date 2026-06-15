import { db } from "../db";
import { patients, encounters, healthTimeline } from "../db/schema";
import { eq } from "drizzle-orm";

export interface PatientCreate {
  name: string;
  age: number;
  sex: string;
  isPregnant?: boolean;
  allergies?: string[];
}

export interface EncounterCreate {
  encounterType: string;
  chiefComplaint: string;
  symptoms: string[];
  questionnaireResponses?: Record<string, unknown>;
  tongueAnalysis?: Record<string, unknown>;
  diagnosisResult?: Record<string, unknown>;
  prescription?: Record<string, unknown>;
  safetyResult?: Record<string, unknown>;
  soapNote?: string;
}

/**
 * PatientMemoryService — longitudinal patient health profile
 */
export class PatientMemoryService {
  /**
   * Create a new patient
   */
  async createPatient(data: PatientCreate) {
    const id = crypto.randomUUID();
    const result = await db.insert(patients).values({
      id,
      name: data.name,
      age: data.age,
      sex: data.sex,
      isPregnant: data.isPregnant ?? false,
      allergies: data.allergies ?? [],
    }).returning();

    return result[0];
  }

  /**
   * Get patient by ID
   */
  async getPatient(id: string) {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result[0] ?? null;
  }

  /**
   * Record a new encounter
   */
  async recordEncounter(patientId: string, data: EncounterCreate) {
    const id = crypto.randomUUID();
    const result = await db.insert(encounters).values({
      id,
      patientId,
      encounterType: data.encounterType,
      chiefComplaint: data.chiefComplaint,
      symptoms: data.symptoms,
      questionnaireResponses: data.questionnaireResponses,
      tongueAnalysis: data.tongueAnalysis,
      diagnosisResult: data.diagnosisResult,
      prescription: data.prescription,
      safetyResult: data.safetyResult,
      soapNote: data.soapNote,
    }).returning();

    // Add to health timeline
    await db.insert(healthTimeline).values({
      id: crypto.randomUUID(),
      patientId,
      eventType: "encounter",
      eventData: { encounterId: id },
      encounterId: id,
    });

    return result[0];
  }

  /**
   * Get encounter history for a patient
   */
  async getEncounterHistory(patientId: string, limit: number = 20) {
    return db.select()
      .from(encounters)
      .where(eq(encounters.patientId, patientId))
      .limit(limit);
  }

  /**
   * Get patient context for diagnosis
   */
  async getPatientContextForDiagnosis(patientId: string): Promise<string> {
    const patient = await this.getPatient(patientId);
    if (!patient) return "";

    const encounters = await this.getEncounterHistory(patientId, 5);

    const context = [
      `患者：${patient.name}，${patient.age}岁，${patient.sex}`,
      patient.isPregnant ? "孕妇" : "",
      patient.allergies?.length ? `过敏史：${patient.allergies.join("、")}` : "",
      encounters.length > 0 ? `近期就诊：\n${encounters.map(e => `- ${e.createdAt}: ${e.chiefComplaint}`).join("\n")}` : "",
    ].filter(Boolean).join("\n");

    return context;
  }
}
