"use server";

import { z } from "zod/v4";
import { context } from "@/context";
import { searchOkrs } from "@/core/application/okr/searchOkrs";
import { getTeamsByUserId } from "@/core/application/team/getTeamsByUserId";
import { listUsersInUserTeams } from "@/core/application/user/listUsersInUserTeams";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { getUserIdFromSession } from "@/lib/session";
import { requireAuth } from "./session";

const searchOkrsInputSchema = z.object({
  query: z.string().min(0),
  teamId: z.string().optional(),
  userId: z.string().optional(),
  quarter: z.string().optional(),
  year: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

export type SearchOkrsInput = z.infer<typeof searchOkrsInputSchema>;

export async function searchOkrsAction(input: SearchOkrsInput) {
  try {
    const session = await requireAuth();
    const validInput = searchOkrsInputSchema.parse(input);

    const result = await searchOkrs(context, {
      searcherId: getUserIdFromSession(session),
      query: validInput.query,
      teamId: validInput.teamId
        ? teamIdSchema.parse(validInput.teamId)
        : undefined,
      userId: validInput.userId
        ? userIdSchema.parse(validInput.userId)
        : undefined,
      quarter: validInput.quarter,
      year: validInput.year,
      pagination: {
        page: validInput.page,
        limit: validInput.limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in searchOkrsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getSearchFiltersAction() {
  try {
    const session = await requireAuth();

    // Get teams the user belongs to
    const teamsResult = await getTeamsByUserId(context, {
      userId: getUserIdFromSession(session),
    });

    if (teamsResult.isErr()) {
      return {
        success: false,
        error: teamsResult.error.message,
      };
    }

    // Get users in the same teams
    const usersResult = await listUsersInUserTeams(context, {
      userId: getUserIdFromSession(session),
    });

    if (usersResult.isErr()) {
      return {
        success: false,
        error: usersResult.error.message,
      };
    }

    // Generate available quarters and years
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const quarters = ["Q1", "Q2", "Q3", "Q4"];

    return {
      success: true,
      data: {
        teams: teamsResult.value.teams,
        users: usersResult.value,
        years,
        quarters,
      },
    };
  } catch (error) {
    console.error("Error in getSearchFiltersAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
