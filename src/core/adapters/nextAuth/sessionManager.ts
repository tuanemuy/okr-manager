import { err, ok, type Result } from "neverthrow";
import type { SessionManager } from "@/core/domain/auth/ports/sessionManager";
import {
  type SessionData,
  SessionError,
  sessionDataSchema,
} from "@/core/domain/auth/types";
import { validate } from "@/lib/validation";
import type { NextAuthService } from "./authService";

export class NextAuthSessionManager implements SessionManager {
  constructor(private authService: NextAuthService) {}

  async getSession(): Promise<Result<SessionData | null, SessionError>> {
    try {
      const handlers = this.authService.getHandlers();
      const session = await handlers.auth();

      if (!session) {
        return ok(null);
      }

      const validationResult = validate(sessionDataSchema, session);

      return validationResult.mapErr(
        (error) => new SessionError("Invalid session data", error),
      );
    } catch (error) {
      return err(new SessionError("Failed to get session", error));
    }
  }

  async get(): Promise<Result<SessionData | null, SessionError>> {
    return this.getSession();
  }

  async destroy(): Promise<Result<void, SessionError>> {
    try {
      const handlers = this.authService.getHandlers();
      await handlers.signOut();
      return ok(undefined);
    } catch (error) {
      return err(new SessionError("Failed to destroy session", error));
    }
  }
}
