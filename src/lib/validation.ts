import { err, ok, type Result, ResultAsync } from "neverthrow";
import type { z } from "zod/v4";
import { AnyError } from "./error";

export class ValidationError<T> extends AnyError {
  override readonly name = "ValidationError";

  constructor(
    public readonly error: z.ZodError<T>,
    override readonly message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

/**
 * Validates data against a schema and returns a Result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, ValidationError<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    return err(
      new ValidationError(
        result.error,
        "Validation error occurred",
        result.error,
      ),
    );
  }

  return ok(result.data);
}
