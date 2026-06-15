/**
 * DiseaseCourseTimeline — tracks disease progression over time
 */

export interface TimelineEvent {
  date: string;
  eventType: "encounter" | "constitution_change" | "dietary_plan" | "milestone";
  details: Record<string, unknown>;
  encounterId?: string;
}

export interface SyndromeProgression {
  date: string;
  syndrome: string;
  probability: number;
}

export interface TreatmentResponse {
  encounterId: string;
  date: string;
  symptomsBefore: string[];
  symptomsAfter: string[];
  improvement: "improved" | "stable" | "worsened";
}

export class DiseaseCourseTimeline {
  private patientId: string;
  private events: TimelineEvent[];

  constructor(patientId: string, events: TimelineEvent[]) {
    this.patientId = patientId;
    this.events = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get syndrome progression over time
   */
  getSyndromeProgression(): SyndromeProgression[] {
    return this.events
      .filter(e => e.eventType === "encounter" && e.details.diagnosis)
      .map(e => ({
        date: e.date,
        syndrome: (e.details.diagnosis as any)?.syndrome || "未知",
        probability: (e.details.diagnosis as any)?.probability || 0,
      }));
  }

  /**
   * Get treatment response across visits
   */
  getTreatmentResponse(): TreatmentResponse[] {
    const responses: TreatmentResponse[] = [];

    for (let i = 0; i < this.events.length - 1; i++) {
      const current = this.events[i];
      const previous = this.events[i + 1];

      if (current.eventType === "encounter" && previous.eventType === "encounter") {
        const currentSymptoms = (current.details.symptoms as string[]) || [];
        const previousSymptoms = (previous.details.symptoms as string[]) || [];

        const improved = currentSymptoms.length < previousSymptoms.length;
        const worsened = currentSymptoms.length > previousSymptoms.length;

        responses.push({
          encounterId: current.encounterId || "",
          date: current.date,
          symptomsBefore: previousSymptoms,
          symptomsAfter: currentSymptoms,
          improvement: improved ? "improved" : worsened ? "worsened" : "stable",
        });
      }
    }

    return responses;
  }

  /**
   * Get current state (latest snapshot)
   */
  getCurrentState(): Record<string, unknown> | null {
    const latestEncounter = this.events.find(e => e.eventType === "encounter");
    return latestEncounter?.details || null;
  }

  /**
   * Serialize to string for LLM context injection
   */
  toContextString(): string {
    const lines: string[] = [`患者 ${this.patientId} 的病程记录：`];

    for (const event of this.events.slice(0, 5)) {
      lines.push(`- ${event.date}: ${this.formatEvent(event)}`);
    }

    const progression = this.getSyndromeProgression();
    if (progression.length > 1) {
      lines.push("\n证型演变：");
      for (const p of progression.slice(0, 3)) {
        lines.push(`- ${p.date}: ${p.syndrome} (${(p.probability * 100).toFixed(0)}%)`);
      }
    }

    return lines.join("\n");
  }

  private formatEvent(event: TimelineEvent): string {
    switch (event.eventType) {
      case "encounter":
        return `就诊 - 主诉：${event.details.chiefComplaint || "无"}`;
      case "constitution_change":
        return `体质变化 - ${event.details.type || "无"}`;
      case "dietary_plan":
        return `膳食方案更新`;
      case "milestone":
        return `里程碑 - ${event.details.description || "无"}`;
      default:
        return "未知事件";
    }
  }
}
