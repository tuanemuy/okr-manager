import type { PasswordHasher } from "@/core/domain/user/ports/passwordHasher";
import type { ApplicationError } from "@/lib/error";
import type { Result } from "neverthrow";
import { ok } from "neverthrow";

export class MockPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<Result<string, ApplicationError>> {
    // Simple mock implementation - just prefix with "hashed:"
    return ok(`hashed:${password}`);
  }

  async verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, ApplicationError>> {
    // Check if the hashed password matches our mock format
    return ok(hashedPassword === `hashed:${password}`);
  }
}
