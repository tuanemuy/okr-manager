import type { ApplicationError } from "@/lib/error";
import type { Result } from "neverthrow";

export interface PasswordHasher {
  hash(password: string): Promise<Result<string, ApplicationError>>;
  verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, ApplicationError>>;
}
