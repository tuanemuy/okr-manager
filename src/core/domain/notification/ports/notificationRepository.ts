import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type { UserId } from "../../user/types";
import type {
  Notification,
  NotificationId,
  NotificationSettings,
} from "../types";

export interface NotificationRepository {
  getByUserId(
    userId: UserId,
    page: number,
    limit: number,
    unreadOnly?: boolean,
  ): Promise<
    Result<
      { items: Notification[]; totalCount: number; unreadCount: number },
      RepositoryError
    >
  >;
  markAsRead(id: NotificationId): Promise<Result<void, RepositoryError>>;
  getUserSettings(
    userId: UserId,
  ): Promise<Result<NotificationSettings, RepositoryError>>;
  updateUserSettings(
    userId: UserId,
    settings: NotificationSettings,
  ): Promise<Result<void, RepositoryError>>;
}
