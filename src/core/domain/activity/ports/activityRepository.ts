import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type { UserId } from "../../user/types";
import type { Activity } from "../types";

export interface ActivityRepository {
  getRecentActivity(
    userId: UserId,
    limit: number,
  ): Promise<Result<Activity[], RepositoryError>>;
}
