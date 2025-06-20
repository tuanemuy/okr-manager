import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export interface NotificationSettings {
  invitations: boolean;
  reviewReminders: boolean;
  progressUpdates: boolean;
  teamUpdates: boolean;
}

export const getUserNotificationSettingsInputSchema = z.object({
  userId: userIdSchema,
});

export type GetUserNotificationSettingsInput = z.infer<
  typeof getUserNotificationSettingsInputSchema
>;

export async function getUserNotificationSettings(
  context: Context<unknown>,
  input: GetUserNotificationSettingsInput,
): Promise<Result<NotificationSettings, ApplicationError>> {
  const parseResult = validate(getUserNotificationSettingsInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { userId } = parseResult.value;

  // Mock implementation - in a real app you'd fetch from the database
  const mockSettings: NotificationSettings = {
    invitations: true,
    reviewReminders: true,
    progressUpdates: false,
    teamUpdates: true,
  };

  return ok(mockSettings);
}
