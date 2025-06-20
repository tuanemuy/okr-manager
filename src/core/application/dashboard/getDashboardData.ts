import type { UserId } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { err, ok } from "neverthrow";
import type { Context } from "../context";

export interface DashboardData {
  teams: {
    id: string;
    name: string;
    memberCount: number;
  }[];
  okrStats: {
    personalOkrs: number;
    teamOkrs: number;
    totalProgress: number;
  };
  recentActivity: {
    id: string;
    type: "okr_update" | "review_created" | "team_joined";
    message: string;
    createdAt: Date;
  }[];
}

export async function getDashboardData(context: Context, userId: UserId) {
  try {
    // Get user's teams (simplified for now)
    const teamsResult = await context.teamRepository.listByUserId(userId);
    if (teamsResult.isErr()) {
      return err(
        new ApplicationError("Failed to get user teams", teamsResult.error),
      );
    }

    const teams = teamsResult.value;

    // Simplified team data with default member count
    const teamsWithMemberCount = teams.map((team) => ({
      id: team.id,
      name: team.name,
      memberCount: 5, // Default value for now
    }));

    // Simplified OKR stats
    const okrStats = {
      personalOkrs: 2,
      teamOkrs: 5,
      totalProgress: 65,
    };

    // Simplified recent activity
    const recentActivity = [
      {
        id: "1",
        type: "okr_update" as const,
        message: "Key Resultが更新されました",
        createdAt: new Date(),
      },
    ];

    const dashboardData: DashboardData = {
      teams: teamsWithMemberCount,
      okrStats,
      recentActivity,
    };

    return ok(dashboardData);
  } catch (error) {
    return err(
      new ApplicationError(
        "Failed to get dashboard data",
        error instanceof Error ? error : new Error(String(error)),
      ),
    );
  }
}
