import { describe, it, expect } from "vitest";
import { SafetyEngine } from "@/lib/safety/engine";
import type { Prescription, Patient } from "@/lib/core/models";

describe("SafetyEngine", () => {
  const engine = new SafetyEngine();

  const dummyPatient: Patient = {
    patientId: "test-001",
    age: 30,
    sex: "男",
    isPregnant: false,
    allergies: [],
    chiefComplaint: "失眠",
    symptoms: ["失眠", "多梦"],
    tongueImagePath: null,
    questionnaireResponses: null,
  };

  const pregnantPatient: Patient = {
    ...dummyPatient,
    isPregnant: true,
  };

  it("passes safe prescription", () => {
    const prescription: Prescription = {
      treatmentPrinciple: "养心安神",
      formulaName: "酸枣仁汤",
      herbs: [
        { name: "酸枣仁", pinyin: "suanzaoren", doseGrams: 15, processing: null, role: "君" },
        { name: "茯苓", pinyin: "fuling", doseGrams: 10, processing: null, role: "臣" },
      ],
      modifications: "",
      usage: "水煎服",
    };

    const result = engine.validatePrescription(prescription, dummyPatient);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.blocking).toBe(false);
  });

  it("blocks incompatibility (十八反)", () => {
    const prescription: Prescription = {
      treatmentPrinciple: "test",
      formulaName: null,
      herbs: [
        { name: "甘草", pinyin: "gancao", doseGrams: 5, processing: null, role: "君" },
        { name: "甘遂", pinyin: "gansui", doseGrams: 3, processing: null, role: "臣" },
      ],
      modifications: "",
      usage: "水煎服",
    };

    const result = engine.validatePrescription(prescription, dummyPatient);
    expect(result.passed).toBe(false);
    expect(result.blocking).toBe(true);
    expect(result.violations.some(v => v.ruleType === "incompatibility")).toBe(true);
  });

  it("blocks overdose", () => {
    const prescription: Prescription = {
      treatmentPrinciple: "test",
      formulaName: null,
      herbs: [
        { name: "细辛", pinyin: "xixin", doseGrams: 10, processing: null, role: "君" },
      ],
      modifications: "",
      usage: "水煎服",
    };

    const result = engine.validatePrescription(prescription, dummyPatient);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.ruleType === "overdose")).toBe(true);
  });

  it("blocks pregnancy contraindications", () => {
    const prescription: Prescription = {
      treatmentPrinciple: "test",
      formulaName: null,
      herbs: [
        { name: "麝香", pinyin: "shexiang", doseGrams: 0.1, processing: null, role: "君" },
      ],
      modifications: "",
      usage: "外用",
    };

    const result = engine.validatePrescription(prescription, pregnantPatient);
    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.ruleType === "pregnancy")).toBe(true);
  });
});
