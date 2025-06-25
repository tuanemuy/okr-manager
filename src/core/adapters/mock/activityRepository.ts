import { ok, type Result } from "neverthrow";
import type { ActivityRepository } from "@/core/domain/activity/ports/activityRepository";
import type { Activity } from "@/core/domain/activity/types";
import type { UserId } from "@/core/domain/user/types";
import type { RepositoryError } from "@/lib/error";

export class MockActivityRepository implements ActivityRepository {
  private activities: Activity[] = [];

  async getRecentActivity(
    userId: UserId,
    limit: number,
  ): Promise<Result<Activity[], RepositoryError>> {
    const userActivities = this.activities
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return ok(userActivities);
  }

  // Helper methods for testing
  clear(): void {
    this.activities = [];
  }

  addActivity(activity: Activity): void {
    this.activities.push(activity);
  }
}
