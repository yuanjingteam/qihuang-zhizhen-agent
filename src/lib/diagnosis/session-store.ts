import type { GraphStateType } from "../graph/state";

/**
 * In-memory store for diagnosis sessions that need to pause for user input.
 * In production, replace with Redis or database-backed store.
 */
class DiagnosisSessionStore {
  private sessions = new Map<string, GraphStateType>();

  save(sessionId: string, state: GraphStateType): void {
    this.sessions.set(sessionId, state);
  }

  load(sessionId: string): GraphStateType | null {
    return this.sessions.get(sessionId) ?? null;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const diagnosisSessions = new DiagnosisSessionStore();
