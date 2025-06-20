import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const markNotificationAsReadInputSchema = z.object({
  notificationId: z.string(),
  userId: userIdSchema,
});

export type MarkNotificationAsReadInput = z.infer<
  typeof markNotificationAsReadInputSchema
>;

export async function markNotificationAsRead(
  context: Context<unknown>,
  input: MarkNotificationAsReadInput,
): Promise<Result<void, ApplicationError>> {
  const parseResult = validate(markNotificationAsReadInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { notificationId, userId } = parseResult.value;

  // Mock implementation - in a real app you'd update the notification in the database
  console.log(
    `Marking notification ${notificationId} as read for user ${userId}`,
  );

  return ok(undefined);
}
