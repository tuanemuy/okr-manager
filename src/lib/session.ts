import type { SessionData } from "@/core/domain/auth/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { validate } from "@/lib/validation";

export function getUserIdFromSession(session: SessionData): UserId {
  const result = validate(userIdSchema, session.user.id);
  if (result.isErr()) {
    throw new Error(`Invalid user ID in session: ${result.error.message}`);
  }
  return result.value as UserId;
}

export function getUserEmailFromSession(session: SessionData): string {
  return session.user.email;
}

export function getUserNameFromSession(session: SessionData): string {
  return session.user.name;
}
