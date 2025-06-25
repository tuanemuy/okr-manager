import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { NotificationSettings } from "@/core/domain/notification/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

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

  const result = await context.notificationRepository.getUserSettings(userId);

  return result.mapErr(
    (error) =>
      new ApplicationError("Failed to get notification settings", error),
  );
}
