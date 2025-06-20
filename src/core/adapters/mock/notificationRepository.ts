import { ok, type Result } from "neverthrow";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type {
  Notification,
  NotificationId,
  NotificationSettings,
} from "@/core/domain/notification/types";
import type { UserId } from "@/core/domain/user/types";
import type { RepositoryError } from "@/lib/error";

export class MockNotificationRepository implements NotificationRepository {
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
    return ok({ items: [], totalCount: 0, unreadCount: 0 });
  }

  async markAsRead(
    _id: NotificationId,
  ): Promise<Result<void, RepositoryError>> {
    return ok(undefined);
  }

  async getUserSettings(
    _userId: UserId,
  ): Promise<Result<NotificationSettings, RepositoryError>> {
    return ok({
      invitations: true,
      reviewReminders: true,
      progressUpdates: false,
      teamUpdates: true,
    });
  }

  async updateUserSettings(
    _userId: UserId,
    _settings: NotificationSettings,
  ): Promise<Result<void, RepositoryError>> {
    return ok(undefined);
  }
}
