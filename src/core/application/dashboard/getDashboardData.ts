import { err, ok } from "neverthrow";
import type { Activity } from "@/core/domain/activity/types";
import type { UserId } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
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
  recentActivity: Activity[];
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

    // Get team member counts, OKR statistics, and recent activity in parallel
    const [
      memberCountsResult,
      personalOkrsResult,
      teamOkrsResult,
      recentActivityResult,
    ] = await Promise.all([
      context.teamRepository.getBatchTeamMemberCounts(teams.map((t) => t.id)),
      context.okrRepository.listByUserId(userId),
      context.okrRepository.listByTeams(teams.map((t) => t.id)),
      context.activityRepository.getRecentActivity(userId, 5),
    ]);

    const memberCounts = memberCountsResult.isOk()
      ? memberCountsResult.value
      : {};
    const teamsWithMemberCount = teams.map((team) => ({
      id: team.id,
      name: team.name,
      memberCount: memberCounts[team.id] || 0,
    }));

    const personalOkrs = personalOkrsResult.isOk()
      ? personalOkrsResult.value
      : [];
    const teamOkrs = teamOkrsResult.isOk() ? teamOkrsResult.value : [];
    const allOkrs = [...personalOkrs, ...teamOkrs];

    const totalProgress =
      allOkrs.length > 0
        ? Math.round(
            allOkrs.reduce((sum, okr) => sum + (okr.progress || 0), 0) /
              allOkrs.length,
          )
        : 0;

    const okrStats = {
      personalOkrs: personalOkrs.length,
      teamOkrs: teamOkrs.length,
      totalProgress,
    };

    const recentActivity = recentActivityResult.isOk()
      ? recentActivityResult.value
      : [];

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
