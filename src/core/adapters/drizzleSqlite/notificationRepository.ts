import { err, ok, type Result } from "neverthrow";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type {
  Notification,
  NotificationId,
  NotificationSettings,
} from "@/core/domain/notification/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";

export class DrizzleSqliteNotificationRepository
  implements NotificationRepository
{
  async getByUserId(
    _userId: UserId,
    _page: number,
    _limit: number,
    _unreadOnly?: boolean,
  ): Promise<
    Result<
      { items: Notification[]; totalCount: number; unreadCount: number },
      RepositoryError
    >
  > {
    try {
      // For now, return empty since we don't have notification table yet
      // TODO: Implement proper notification storage
      return ok({ items: [], totalCount: 0, unreadCount: 0 });
    } catch (error) {
      return err(new RepositoryError("Failed to get notifications", error));
    }
  }

  async markAsRead(
    _id: NotificationId,
  ): Promise<Result<void, RepositoryError>> {
    try {
      // TODO: Implement mark as read
      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to mark notification as read", error),
      );
    }
  }

  async getUserSettings(
    _userId: UserId,
  ): Promise<Result<NotificationSettings, RepositoryError>> {
    try {
      // TODO: Implement user settings storage
      return ok({
        invitations: true,
        reviewReminders: true,
        progressUpdates: false,
        teamUpdates: true,
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to get notification settings", error),
      );
    }
  }

  async updateUserSettings(
    _userId: UserId,
    _settings: NotificationSettings,
  ): Promise<Result<void, RepositoryError>> {
    try {
      // TODO: Implement user settings update
      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to update notification settings", error),
      );
    }
  }
}
