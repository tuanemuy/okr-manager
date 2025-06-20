import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { SearchOkrResult } from "@/core/domain/okr/ports/okrRepository";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import { paginationSchema } from "@/lib/pagination";
import { validate } from "@/lib/validation";
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

  const {
    searcherId: _searcherId,
    query,
    teamId,
    userId: _userId,
    quarter: _quarter,
    year,
    pagination,
  } = parseResult.value;

  try {
    const result = await context.okrRepository.search({
      query,
      teamId,
      userId: _userId,
      quarter: _quarter,
      year,
      pagination,
    });

    return result.mapErr(
      (error) => new ApplicationError("Failed to search OKRs", error),
    );
  } catch (error) {
    return err(new ApplicationError("Failed to search OKRs", error));
  }
}
