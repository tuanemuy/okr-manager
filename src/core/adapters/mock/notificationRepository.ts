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
  private notifications: Notification[] = [];
  private settings: Map<UserId, NotificationSettings> = new Map();

  async getByUserId(
    userId: UserId,
    page: number,
    limit: number,
    unreadOnly?: boolean,
  ): Promise<
    Result<
      { items: Notification[]; totalCount: number; unreadCount: number },
      RepositoryError
    >
  > {
    let filteredNotifications = this.notifications.filter(
      (n) => n.userId === userId,
    );

    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter((n) => !n.isRead);
    }

    const totalCount = filteredNotifications.length;
    const unreadCount = this.notifications.filter(
      (n) => n.userId === userId && !n.isRead,
    ).length;

    const offset = (page - 1) * limit;
    const items = filteredNotifications.slice(offset, offset + limit);

    return ok({ items, totalCount, unreadCount });
  }

  async markAsRead(id: NotificationId): Promise<Result<void, RepositoryError>> {
    const notificationIndex = this.notifications.findIndex((n) => n.id === id);
    if (notificationIndex >= 0) {
      this.notifications[notificationIndex] = {
        ...this.notifications[notificationIndex],
        isRead: true,
      };
    }
    return ok(undefined);
  }

  async getUserSettings(
    userId: UserId,
  ): Promise<Result<NotificationSettings, RepositoryError>> {
    const settings = this.settings.get(userId) || {
      invitations: true,
      reviewReminders: true,
      progressUpdates: false,
      teamUpdates: true,
    };
    return ok(settings);
  }

  async updateUserSettings(
    userId: UserId,
    settings: NotificationSettings,
  ): Promise<Result<void, RepositoryError>> {
    this.settings.set(userId, settings);
    return ok(undefined);
  }

  // Helper methods for testing
  clear(): void {
    this.notifications = [];
    this.settings.clear();
  }

  addNotification(notification: Notification): void {
    this.notifications.push(notification);
  }

  setUserSettings(userId: UserId, settings: NotificationSettings): void {
    this.settings.set(userId, settings);
  }
}
