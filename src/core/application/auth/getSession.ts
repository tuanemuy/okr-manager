import type { SessionData, SessionError } from "@/core/domain/auth/types";
import type { Result } from "neverthrow";
import type { Context } from "../context";

export async function getSession(
  context: Context,
): Promise<Result<SessionData | null, SessionError>> {
  return context.authService.getSession();
}
