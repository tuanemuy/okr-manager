import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const markAllNotificationsAsReadInputSchema = z.object({
  userId: userIdSchema,
});

export type MarkAllNotificationsAsReadInput = z.infer<
  typeof markAllNotificationsAsReadInputSchema
>;

export async function markAllNotificationsAsRead(
  context: Context<unknown>,
  input: MarkAllNotificationsAsReadInput,
): Promise<Result<void, ApplicationError>> {
  const parseResult = validate(markAllNotificationsAsReadInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { userId } = parseResult.value;

  // Mock implementation - in a real app you'd update all notifications in the database
  console.log(`Marking all notifications as read for user ${userId}`);

  return ok(undefined);
}
