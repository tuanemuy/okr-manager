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
    overdue: number;
    dueThisWeek: number;
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

    // Calculate overdue and due this week OKRs
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get the end of the current quarter for deadline calculation
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();
    const quarterEndMonth = currentQuarter * 3 - 1; // 0-based month index
    const quarterEndDate = new Date(currentYear, quarterEndMonth + 1, 0); // Last day of quarter

    const overdue = allOkrs.filter((okr) => {
      // Check if OKR is from a past quarter/year
      const isOldQuarter =
        okr.quarterYear < currentYear ||
        (okr.quarterYear === currentYear &&
          okr.quarterQuarter < currentQuarter);
      return isOldQuarter && (okr.progress || 0) < 100;
    }).length;

    const dueThisWeek = allOkrs.filter((okr) => {
      // Check if OKR is due within a week
      const isCurrentQuarter =
        okr.quarterYear === currentYear &&
        okr.quarterQuarter === currentQuarter;
      return (
        isCurrentQuarter &&
        quarterEndDate <= oneWeekFromNow &&
        quarterEndDate >= now
      );
    }).length;

    const okrStats = {
      personalOkrs: personalOkrs.length,
      teamOkrs: teamOkrs.length,
      totalProgress,
      overdue,
      dueThisWeek,
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
