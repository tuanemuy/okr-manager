import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Notification } from "@/core/domain/notification/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

export const getNotificationsByUserIdInputSchema = z.object({
  userId: userIdSchema,
  pagination: paginationSchema,
  unreadOnly: z.boolean().default(false),
});

export type GetNotificationsByUserIdInput = z.infer<
  typeof getNotificationsByUserIdInputSchema
>;

export async function getNotificationsByUserId(
  context: Context<unknown>,
  input: GetNotificationsByUserIdInput,
): Promise<
  Result<
    { items: Notification[]; totalCount: number; unreadCount: number },
    ApplicationError
  >
> {
  const parseResult = validate(getNotificationsByUserIdInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { userId, pagination, unreadOnly } = parseResult.value;

  const result = await context.notificationRepository.getByUserId(
    userId,
    pagination.page,
    pagination.limit,
    unreadOnly,
  );

  return result.mapErr(
    (error) => new ApplicationError("Failed to get notifications", error),
  );
}
