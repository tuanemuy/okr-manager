import { err, type Result } from "neverthrow";
import type { z } from "zod/v4";
import {
  AuthenticationError,
  type SessionData,
  signInCredentialsSchema,
} from "@/core/domain/auth/types";
import type { Context } from "../context";

export const signInInputSchema = signInCredentialsSchema;
export type SignInInput = z.infer<typeof signInInputSchema>;

export async function signIn(
  context: Context,
  input: SignInInput,
): Promise<Result<SessionData, AuthenticationError>> {
  const parseResult = signInCredentialsSchema.safeParse(input);
  if (!parseResult.success) {
    return err(
      new AuthenticationError("Invalid sign in input", parseResult.error),
    );
  }

  return context.authService.signIn(parseResult.data);
}
