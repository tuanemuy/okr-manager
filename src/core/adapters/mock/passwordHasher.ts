import type { PasswordHasher } from "@/core/domain/user/ports/passwordHasher";
import { ApplicationError } from "@/lib/error";
import { type Result, err, ok } from "neverthrow";

export class MockPasswordHasher implements PasswordHasher {
  private shouldFailHash = false;
  private shouldFailVerify = false;
  private hashErrorMessage = "Failed to hash password";
  private verifyErrorMessage = "Failed to verify password";

  async hash(password: string): Promise<Result<string, ApplicationError>> {
    if (this.shouldFailHash) {
      return err(new ApplicationError(this.hashErrorMessage));
    }
    // Simple mock implementation - just prefix with "hashed:"
    return ok(`hashed:${password}`);
  }

  async verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, ApplicationError>> {
    if (this.shouldFailVerify) {
      return err(new ApplicationError(this.verifyErrorMessage));
    }
    // Check if the hashed password matches our mock format
    return ok(hashedPassword === `hashed:${password}`);
  }

  // Helper methods for testing
  setShouldFailHash(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailHash = shouldFail;
    if (errorMessage) {
      this.hashErrorMessage = errorMessage;
    }
  }

  setShouldFailVerify(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFailVerify = shouldFail;
    if (errorMessage) {
      this.verifyErrorMessage = errorMessage;
    }
  }

  clear(): void {
    this.shouldFailHash = false;
    this.shouldFailVerify = false;
    this.hashErrorMessage = "Failed to hash password";
    this.verifyErrorMessage = "Failed to verify password";
  }
}
