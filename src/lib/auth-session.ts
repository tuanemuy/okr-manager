import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { Context } from "@/core/application/context";
import type { SessionData } from "@/core/domain/auth/types";
import { ApplicationError } from "@/lib/error";

let cachedSession: SessionData | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

export async function getSessionWithCache(
  context: Context,
): Promise<Result<SessionData, ApplicationError>> {
  const now = Date.now();

  // Return cached session if it's still valid
  if (cachedSession && now - cacheTimestamp < CACHE_DURATION) {
    return ok(cachedSession);
  }

  const sessionResult = await context.sessionManager.get();

  if (sessionResult.isErr()) {
    return err(
      new ApplicationError("Failed to get session", sessionResult.error),
    );
  }

  if (!sessionResult.value) {
    return err(new ApplicationError("No active session"));
  }

  // Update cache
  cachedSession = sessionResult.value;
  cacheTimestamp = now;

  return ok(cachedSession);
}

export function clearSessionCache(): void {
  cachedSession = null;
  cacheTimestamp = 0;
}
