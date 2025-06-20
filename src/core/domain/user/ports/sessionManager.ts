import type { Result } from "neverthrow";
import type { SessionData as AuthSessionData } from "@/core/domain/auth/types";
import type { ApplicationError } from "@/lib/error";

export type SessionData = AuthSessionData;

export interface SessionManager {
  get(): Promise<Result<SessionData | null, ApplicationError>>;
  create(sessionData: SessionData): Promise<Result<void, ApplicationError>>;
  destroy(): Promise<Result<void, ApplicationError>>;
}
