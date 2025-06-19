import type { SessionData } from "@/core/domain/auth/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";

export function getUserIdFromSession(session: SessionData): UserId {
  return userIdSchema.parse(session.user.id);
}

export function getUserEmailFromSession(session: SessionData): string {
  return session.user.email;
}

export function getUserNameFromSession(session: SessionData): string {
  return session.user.name;
}
