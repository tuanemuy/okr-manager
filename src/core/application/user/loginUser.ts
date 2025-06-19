import type { User } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

export async function loginUser(
  context: Context,
  input: LoginUserInput,
): Promise<Result<User, ApplicationError>> {
  const parseResult = validate(loginUserInputSchema, input);
  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid login input", parseResult.error));
  }

  const params = parseResult.value;

  const userResult = await context.userRepository.getByEmail(params.email);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("Invalid email or password"));
  }

  const user = userResult.value;

  const verifyResult = await context.passwordHasher.verify(
    params.password,
    user.hashedPassword,
  );
  if (verifyResult.isErr()) {
    return err(
      new ApplicationError("Failed to verify password", verifyResult.error),
    );
  }

  if (!verifyResult.value) {
    return err(new ApplicationError("Invalid email or password"));
  }

  const sessionResult = await context.sessionManager.create({
    user: {
      id: user.id,
      email: user.email,
      name: user.displayName,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  });
  if (sessionResult.isErr()) {
    return err(
      new ApplicationError("Failed to create session", sessionResult.error),
    );
  }

  return ok(user);
}
