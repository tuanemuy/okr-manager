import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { NotificationSettings } from "@/core/domain/notification/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

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
  context: Context<unknown>,
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

  const result = await context.notificationRepository.updateUserSettings(
    userId,
    settings,
  );

  if (result.isErr()) {
    return err(
      new ApplicationError(
        "Failed to update notification settings",
        result.error,
      ),
    );
  }

  return ok(settings);
}
