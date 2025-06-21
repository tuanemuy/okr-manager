import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Okr } from "@/core/domain/okr/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { userIdSchema } from "@/core/domain/user/types";
import { ApplicationError } from "@/lib/error";
import type { Context } from "../context";

export const createOkrInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["team", "personal"]),
  teamId: teamIdSchema,
  ownerId: userIdSchema,
  quarter: z.object({
    year: z.number().int().min(2000).max(3000),
    quarter: z.number().int().min(1).max(4),
  }),
  keyResults: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        targetValue: z.number().min(0),
        unit: z.string().max(50).optional(),
      }),
    )
    .min(1)
    .max(5),
});
export type CreateOkrInput = z.infer<typeof createOkrInputSchema>;

export async function createOkr(
  context: Context,
  input: CreateOkrInput,
): Promise<Result<Okr, ApplicationError>> {
  const parseResult = createOkrInputSchema.safeParse(input);
  if (!parseResult.success) {
    return err(new ApplicationError("Invalid OKR input", parseResult.error));
  }

  const params = parseResult.data;

  // Check if user is team member
  const memberResult = await context.teamMemberRepository.getByTeamAndUser(
    params.teamId,
    params.ownerId,
  );

  if (memberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check team membership",
        memberResult.error,
      ),
    );
  }

  // For team OKRs, only admins can create
  if (params.type === "team") {
    if (!memberResult.value || memberResult.value.role !== "admin") {
      return err(new ApplicationError("Only team admins can create team OKRs"));
    }
  }

  // For personal OKRs, members and admins can create
  if (params.type === "personal") {
    if (
      !memberResult.value ||
      (memberResult.value.role !== "admin" &&
        memberResult.value.role !== "member")
    ) {
      return err(
        new ApplicationError(
          "Only team admins and members can create personal OKRs",
        ),
      );
    }
  }

  // Create OKR
  const okrResult = await context.okrRepository.create({
    title: params.title,
    description: params.description,
    type: params.type,
    teamId: params.teamId,
    ownerId: params.ownerId,
    quarterYear: params.quarter.year,
    quarterQuarter: params.quarter.quarter,
  });

  if (okrResult.isErr()) {
    return err(new ApplicationError("Failed to create OKR", okrResult.error));
  }

  const okr = okrResult.value;

  // Create key results
  for (const keyResult of params.keyResults) {
    const keyResultResult = await context.keyResultRepository.create({
      okrId: okr.id,
      title: keyResult.title,
      targetValue: keyResult.targetValue,
      currentValue: 0,
      unit: keyResult.unit,
    });

    if (keyResultResult.isErr()) {
      return err(
        new ApplicationError(
          "Failed to create key result",
          keyResultResult.error,
        ),
      );
    }
  }

  return ok(okr);
}
