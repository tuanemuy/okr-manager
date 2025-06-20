import { err, ok, type Result } from "neverthrow";
import type { ActivityRepository } from "@/core/domain/activity/ports/activityRepository";
import type { Activity } from "@/core/domain/activity/types";
import type { UserId } from "@/core/domain/user/types";
import { RepositoryError } from "@/lib/error";

export class DrizzleSqliteActivityRepository implements ActivityRepository {
  async getRecentActivity(
    _userId: UserId,
    _limit: number,
  ): Promise<Result<Activity[], RepositoryError>> {
    try {
      // For now, return empty array since we don't have activity table yet
      // TODO: Implement proper activity tracking
      return ok([]);
    } catch (error) {
      return err(new RepositoryError("Failed to get recent activity", error));
    }
  }
}
