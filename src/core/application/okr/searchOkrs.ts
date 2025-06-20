import type { Okr } from "@/core/domain/okr/types";
import { okrIdSchema } from "@/core/domain/okr/types";
import { type TeamId, teamIdSchema } from "@/core/domain/team/types";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { type Pagination, paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";
import { type Result, err, ok } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";

export const searchOkrsInputSchema = z.object({
  searcherId: userIdSchema,
  query: z.string().min(0),
  teamId: teamIdSchema.optional(),
  userId: userIdSchema.optional(),
  quarter: z.string().optional(),
  year: z.number().optional(),
  pagination: paginationSchema,
});

export type SearchOkrsInput = z.infer<typeof searchOkrsInputSchema>;

export interface SearchOkrResult extends Omit<Okr, "keyResults"> {
  teamName: string;
  ownerName: string;
  progress: number;
  keyResults?: Array<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
  }>;
}

export async function searchOkrs(
  context: Context<unknown>,
  input: SearchOkrsInput,
): Promise<
  Result<{ items: SearchOkrResult[]; totalCount: number }, ApplicationError>
> {
  const parseResult = validate(searchOkrsInputSchema, input);

  if (parseResult.isErr()) {
    return err(new ApplicationError("Invalid input", parseResult.error));
  }

  const { searcherId, query, teamId, userId, quarter, year, pagination } =
    parseResult.value;

  // Mock implementation for now - in a real app you'd have proper search functionality
  try {
    const mockOkrs: SearchOkrResult[] = [
      {
        id: okrIdSchema.parse("550e8400-e29b-41d4-a716-446655440001"),
        title: "Increase user engagement",
        description: "Improve user engagement metrics across all platforms",
        type: "team" as const,
        teamId:
          teamId || teamIdSchema.parse("550e8400-e29b-41d4-a716-446655440002"),
        quarterYear: year || 2024,
        quarterQuarter: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
        teamName: "Product Team",
        ownerName: "John Doe",
        progress: 75,
        keyResults: [
          {
            id: "kr-1",
            title: "Increase daily active users by 20%",
            currentValue: 15,
            targetValue: 20,
            unit: "%",
          },
        ],
      },
    ];

    // Apply basic text search filter
    const filteredOkrs = query
      ? mockOkrs.filter(
          (okr) =>
            okr.title.toLowerCase().includes(query.toLowerCase()) ||
            okr.description?.toLowerCase().includes(query.toLowerCase()),
        )
      : mockOkrs;

    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedItems = filteredOkrs.slice(startIndex, endIndex);

    return ok({
      items: paginatedItems,
      totalCount: filteredOkrs.length,
    });
  } catch (error) {
    return err(new ApplicationError("Failed to search OKRs", error));
  }
}
