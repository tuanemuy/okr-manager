import { z } from "zod/v4";
import { userIdSchema } from "../user/types";

export const notificationIdSchema = z.string().uuid().brand("notificationId");
export type NotificationId = z.infer<typeof notificationIdSchema>;

export const notificationTypeSchema = z.enum([
  "invitation",
  "review_reminder",
  "progress_update",
  "team_update",
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: notificationIdSchema,
  userId: userIdSchema,
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationSettingsSchema = z.object({
  invitations: z.boolean(),
  reviewReminders: z.boolean(),
  progressUpdates: z.boolean(),
  teamUpdates: z.boolean(),
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
