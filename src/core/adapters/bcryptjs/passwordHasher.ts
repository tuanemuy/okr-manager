import bcrypt from "bcryptjs";
import { err, ok, type Result } from "neverthrow";
import type { PasswordHasher } from "@/core/domain/user/ports/passwordHasher";
import { ApplicationError } from "@/lib/error";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<Result<string, ApplicationError>> {
    try {
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);
      return ok(hashedPassword);
    } catch (error) {
      return err(new ApplicationError("Failed to hash password", error));
    }
  }

  async verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return ok(isValid);
    } catch (error) {
      return err(new ApplicationError("Failed to verify password", error));
    }
  }
}
