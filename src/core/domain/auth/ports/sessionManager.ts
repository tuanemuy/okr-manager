import type { Result } from "neverthrow";
import type { SessionData, SessionError } from "../types";

export interface SessionManager {
  getSession(): Promise<Result<SessionData | null, SessionError>>;
  get(): Promise<Result<SessionData | null, SessionError>>;
  destroy(): Promise<Result<void, SessionError>>;
  update(): Promise<Result<void, SessionError>>;
}
