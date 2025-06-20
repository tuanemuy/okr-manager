import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";
import type { Context } from "../context";

// Mock notification type - in a real app this would be defined in domain
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export const getNotificationsByUserIdInputSchema = z.object({
  userId: userIdSchema,
  pagination: paginationSchema,
  unreadOnly: z.boolean().default(false),
});

export type GetNotificationsByUserIdInput = z.infer<
  typeof getNotificationsByUserIdInputSchema
>;

export async function getNotificationsByUserId(
  _context: Context<unknown>,
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

  const { userId: _userId, pagination, unreadOnly } = parseResult.value;

  // Mock implementation - in a real app you'd have a notification repository
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "invitation",
      title: "Team Invitation",
      message: "You have been invited to join the Marketing team",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "2",
      type: "review_reminder",
      title: "Review Reminder",
      message: "Your Q4 OKR review is due in 2 days",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "3",
      type: "progress_update",
      title: "Progress Update",
      message: "John updated progress on 'Increase user engagement' OKR",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ];

  const filteredNotifications = unreadOnly
    ? mockNotifications.filter((n) => !n.isRead)
    : mockNotifications;

  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedItems = filteredNotifications.slice(startIndex, endIndex);

  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  return ok({
    items: paginatedItems,
    totalCount: filteredNotifications.length,
    unreadCount,
  });
}
