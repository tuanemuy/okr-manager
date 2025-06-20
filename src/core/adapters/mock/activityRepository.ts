import { ok, type Result } from "neverthrow";
import type { ActivityRepository } from "@/core/domain/activity/ports/activityRepository";
import type { Activity } from "@/core/domain/activity/types";
import type { UserId } from "@/core/domain/user/types";
import type { RepositoryError } from "@/lib/error";

export class MockActivityRepository implements ActivityRepository {
  async getRecentActivity(
    _userId: UserId,
    _limit: number,
  ): Promise<Result<Activity[], RepositoryError>> {
    // Mock implementation
    return ok([]);
  }
}
