import type { Result } from "neverthrow";
import type { ApplicationError } from "@/lib/error";

export interface PasswordHasher {
  hash(password: string): Promise<Result<string, ApplicationError>>;
  verify(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, ApplicationError>>;
}
