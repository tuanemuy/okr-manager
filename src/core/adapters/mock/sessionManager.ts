import { err, ok, type Result } from "neverthrow";
import type { SessionManager } from "@/core/domain/auth/ports/sessionManager";
import type { SessionData } from "@/core/domain/auth/types";
import { SessionError } from "@/core/domain/auth/types";

export class MockSessionManager implements SessionManager {
  private currentSession: SessionData | null = null;
  private shouldFailGet = false;
  private shouldFailCreate = false;
  private shouldFailDestroy = false;
  private getErrorMessage = "Failed to get session";
  private createErrorMessage = "Failed to create session";
  private destroyErrorMessage = "Failed to destroy session";

  async getSession(): Promise<Result<SessionData | null, SessionError>> {
    if (this.shouldFailGet) {
      return err(new SessionError(this.getErrorMessage));
    }
    return ok(this.currentSession);
  }

  async get(): Promise<Result<SessionData | null, SessionError>> {
    return this.getSession();
  }

  async destroy(): Promise<Result<void, SessionError>> {
    if (this.shouldFailDestroy) {
      return err(new SessionError(this.destroyErrorMessage));
    }
    this.currentSession = null;
    return ok(undefined);
  }

  async update(): Promise<Result<void, SessionError>> {
    // Mock implementation - in real scenario this would trigger session refresh
    return ok(undefined);
  }

  // Helper methods for testing
  setCurrentSession(session: SessionData | null): void {
    this.currentSession = session;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  setShouldFailGet(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailGet = shouldFail;
    if (errorMessage) {
      this.getErrorMessage = errorMessage;
    }
  }

  setShouldFailCreate(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailCreate = shouldFail;
    if (errorMessage) {
      this.createErrorMessage = errorMessage;
    }
  }

  setShouldFailDestroy(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailDestroy = shouldFail;
    if (errorMessage) {
      this.destroyErrorMessage = errorMessage;
    }
  }

  clear(): void {
    this.currentSession = null;
    this.shouldFailGet = false;
    this.shouldFailCreate = false;
    this.shouldFailDestroy = false;
    this.getErrorMessage = "Failed to get session";
    this.createErrorMessage = "Failed to create session";
    this.destroyErrorMessage = "Failed to destroy session";
  }
}
