import type {
  SessionData,
  SessionManager,
} from "@/core/domain/user/ports/sessionManager";
import { ApplicationError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";

export class MockSessionManager implements SessionManager {
  private currentSession: SessionData | null = null;
  private shouldFailGet = false;
  private shouldFailCreate = false;
  private shouldFailDestroy = false;
  private getErrorMessage = "Failed to get session";
  private createErrorMessage = "Failed to create session";
  private destroyErrorMessage = "Failed to destroy session";

  async get(): Promise<Result<SessionData | null, ApplicationError>> {
    if (this.shouldFailGet) {
      return err(new ApplicationError(this.getErrorMessage));
    }
    return ok(this.currentSession);
  }

  async create(
    sessionData: SessionData,
  ): Promise<Result<void, ApplicationError>> {
    if (this.shouldFailCreate) {
      return err(new ApplicationError(this.createErrorMessage));
    }
    this.currentSession = sessionData;
    return ok(undefined);
  }

  async destroy(): Promise<Result<void, ApplicationError>> {
    if (this.shouldFailDestroy) {
      return err(new ApplicationError(this.destroyErrorMessage));
    }
    this.currentSession = null;
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
