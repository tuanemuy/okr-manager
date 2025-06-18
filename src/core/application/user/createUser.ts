import type { User } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const createUserInputSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8),
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export async function createUser(
  context: Context,
  input: CreateUserInput,
): Promise<Result<User, ApplicationError>> {
  const parseResult = validate(createUserInputSchema, input);
  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid user input", parseResult.error));
  }

  const params = parseResult.value;

  const existingUser = await context.userRepository.findByEmail(params.email);
  if (existingUser.isErr()) {
    return err(
      new ApplicationError("Failed to check existing user", existingUser.error),
    );
  }

  if (existingUser.value !== null) {
    return err(new ApplicationError("User with this email already exists"));
  }

  const hashResult = await context.passwordHasher.hash(params.password);
  if (hashResult.isErr()) {
    return err(
      new ApplicationError("Failed to hash password", hashResult.error),
    );
  }

  const createParams = {
    email: params.email,
    displayName: params.displayName,
    hashedPassword: hashResult.value,
  };

  const createResult = await context.userRepository.create(createParams);
  return createResult.mapErr(
    (error) => new ApplicationError("Failed to create user", error),
  );
}
