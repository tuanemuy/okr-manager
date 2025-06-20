import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";
import type { NotificationSettings } from "./getUserNotificationSettings";

export const updateUserNotificationSettingsInputSchema = z.object({
  userId: userIdSchema,
  settings: z.object({
    invitations: z.boolean(),
    reviewReminders: z.boolean(),
    progressUpdates: z.boolean(),
    teamUpdates: z.boolean(),
  }),
});

export type UpdateUserNotificationSettingsInput = z.infer<
  typeof updateUserNotificationSettingsInputSchema
>;

export async function updateUserNotificationSettings(
  _context: Context<unknown>,
  input: UpdateUserNotificationSettingsInput,
): Promise<Result<NotificationSettings, ApplicationError>> {
  const parseResult = validate(
    updateUserNotificationSettingsInputSchema,
    input,
  );

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { userId, settings } = parseResult.value;

  // Mock implementation - in a real app you'd update in the database
  console.log(`Updating notification settings for user ${userId}:`, settings);

  return ok(settings);
}
