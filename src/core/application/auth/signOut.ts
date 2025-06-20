import type { Result } from "neverthrow";
import type { AuthenticationError } from "@/core/domain/auth/types";
import type { Context } from "../context";

export async function signOut(
  context: Context,
): Promise<Result<void, AuthenticationError>> {
  return context.authService.signOut();
}
