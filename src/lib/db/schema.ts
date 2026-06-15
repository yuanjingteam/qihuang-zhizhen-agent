import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  isPregnant: boolean("is_pregnant").default(false),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  constitutionBaseline: jsonb("constitution_baseline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const encounters = pgTable("encounters", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id),
  encounterType: text("encounter_type"),
  chiefComplaint: text("chief_complaint"),
  symptoms: jsonb("symptoms").$type<string[]>(),
  questionnaireResponses: jsonb("questionnaire_responses"),
  tongueAnalysis: jsonb("tongue_analysis"),
  diagnosisResult: jsonb("diagnosis_result"),
  prescription: jsonb("prescription"),
  safetyResult: jsonb("safety_result"),
  soapNote: text("soap_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const constitutionAssessments = pgTable("constitution_assessments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id),
  assessmentType: text("assessment_type"),
  scores: jsonb("scores"),
  dominantType: text("dominant_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthTimeline = pgTable("health_timeline", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id),
  eventType: text("event_type"),
  eventData: jsonb("event_data"),
  encounterId: text("encounter_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
