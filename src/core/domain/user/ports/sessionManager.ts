import type { ApplicationError } from "@/lib/error";
import type { Result } from "neverthrow";
import type { UserId } from "../types";

export interface SessionData {
  userId: UserId;
  email: string;
  displayName: string;
}

export interface SessionManager {
  get(): Promise<Result<SessionData | null, ApplicationError>>;
  create(userId: UserId): Promise<Result<void, ApplicationError>>;
  destroy(): Promise<Result<void, ApplicationError>>;
}
