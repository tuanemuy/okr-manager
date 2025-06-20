"use server";

import { context } from "@/context";
import { createOkr } from "@/core/application/okr/createOkr";
import { createReview } from "@/core/application/okr/createReview";
import { updateKeyResult } from "@/core/application/okr/updateKeyResult";
import { updateKeyResultProgress } from "@/core/application/okr/updateKeyResultProgress";
import { updateOkr } from "@/core/application/okr/updateOkr";
import {
  type OkrType,
  keyResultIdSchema,
  okrIdSchema,
} from "@/core/domain/okr/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { getUserIdFromSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { requireAuth } from "./session";

export async function createOkrAction(teamId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as OkrType;
  const quarter = formData.get("quarter") as string;
  const year = Number(formData.get("year"));

  // Parse key results from form data
  const keyResults = [];
  let keyResultIndex = 1;

  while (formData.get(`keyResult-${keyResultIndex}-title`)) {
    const krTitle = formData.get(`keyResult-${keyResultIndex}-title`) as string;
    const krTargetValue = Number(
      formData.get(`keyResult-${keyResultIndex}-targetValue`),
    );
    const krUnit = formData.get(`keyResult-${keyResultIndex}-unit`) as string;

    if (krTitle && krTargetValue) {
      keyResults.push({
        title: krTitle,
        targetValue: krTargetValue,
        unit: krUnit || undefined,
      });
    }
    keyResultIndex++;
  }

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await createOkr(context, {
    title,
    description: description || undefined,
    type: type === "team" ? "team" : "individual",
    quarter: {
      year,
      quarter: Number(quarter),
    },
    teamId: teamIdSchema.parse(teamId),
    ownerId: getUserIdFromSession(session),
    keyResults,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/teams/${teamId}/okrs`);
  redirect(`/teams/${teamId}/okrs/${result.value.id}`);
}

export async function updateKeyResultProgressAction(
  keyResultId: string,
  formData: FormData,
) {
  const currentValue = Number(formData.get("currentValue"));

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await updateKeyResultProgress(context, {
    keyResultId: keyResultIdSchema.parse(keyResultId),
    currentValue,
    userId: getUserIdFromSession(session),
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  // Revalidate the OKR page
  const keyResult = result.value;
  const okrResult = await context.okrRepository.getById(keyResult.okrId);
  if (okrResult.isOk() && okrResult.value) {
    revalidatePath(`/teams/${okrResult.value.teamId}/okrs/${keyResult.okrId}`);
  }
}

export async function createReviewAction(okrId: string, formData: FormData) {
  const content = formData.get("content") as string;
  const reviewType = formData.get("reviewType") as "mid" | "final";

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await createReview(context, {
    okrId: okrIdSchema.parse(okrId),
    content,
    type: reviewType as "progress" | "final",
    reviewerId: getUserIdFromSession(session),
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  // Get team ID for revalidation
  const okrResult = await context.okrRepository.getById(
    okrIdSchema.parse(okrId),
  );
  if (okrResult.isOk() && okrResult.value) {
    revalidatePath(`/teams/${okrResult.value.teamId}/okrs/${okrId}/reviews`);
  }
}

export async function getOkrsAction(teamId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const result = await context.okrRepository.listByTeam(
    teamIdSchema.parse(teamId),
  );

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

export async function getOkrAction(okrId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const okrResult = await context.okrRepository.getById(
    okrIdSchema.parse(okrId),
  );
  if (okrResult.isErr() || !okrResult.value) {
    throw new Error(
      okrResult.isErr() ? okrResult.error.message : "OKR not found",
    );
  }

  const keyResultsResult = await context.keyResultRepository.listByOkr(
    okrIdSchema.parse(okrId),
  );
  if (keyResultsResult.isErr()) {
    throw new Error(keyResultsResult.error.message);
  }

  return {
    okr: okrResult.value,
    keyResults: keyResultsResult.value,
  };
}

export async function getOkrReviewsAction(okrId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const result = await context.reviewRepository.listByOkr(
    okrIdSchema.parse(okrId),
  );

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

export async function deleteOkrAction(okrId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  // Get OKR to check permissions and get team ID
  const okrResult = await context.okrRepository.getById(
    okrIdSchema.parse(okrId),
  );
  if (okrResult.isErr() || !okrResult.value) {
    throw new Error("OKR not found");
  }

  const okr = okrResult.value;

  // Check if user is the creator or team admin
  if (okr.ownerId !== getUserIdFromSession(session)) {
    const memberResult = await context.teamMemberRepository.getByTeamAndUser(
      okr.teamId,
      getUserIdFromSession(session),
    );
    if (
      memberResult.isErr() ||
      !memberResult.value ||
      memberResult.value.role !== "admin"
    ) {
      throw new Error("Not authorized");
    }
  }

  const result = await context.okrRepository.delete(okrIdSchema.parse(okrId));
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/teams/${okr.teamId}/okrs`);
  redirect(`/teams/${okr.teamId}/okrs`);
}

export async function addKeyResultAction(okrId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const targetValue = Number(formData.get("targetValue"));
  const unit = formData.get("unit") as string;

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const result = await context.keyResultRepository.create({
    okrId: okrIdSchema.parse(okrId),
    title,
    targetValue,
    currentValue: 0,
    unit: unit || undefined,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  // Get team ID for revalidation
  const okrResult = await context.okrRepository.getById(
    okrIdSchema.parse(okrId),
  );
  if (okrResult.isOk() && okrResult.value) {
    revalidatePath(`/teams/${okrResult.value.teamId}/okrs/${okrId}`);
  }
}

const updateOkrInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

export type UpdateOkrInput = z.infer<typeof updateOkrInputSchema>;

export async function updateOkrAction(okrId: string, input: UpdateOkrInput) {
  try {
    const session = await requireAuth();
    const validInput = updateOkrInputSchema.parse(input);

    const result = await updateOkr(context, {
      okrId: okrIdSchema.parse(okrId),
      userId: getUserIdFromSession(session),
      ...validInput,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Get team ID for revalidation
    const okrResult = await context.okrRepository.getById(
      okrIdSchema.parse(okrId),
    );
    if (okrResult.isOk() && okrResult.value) {
      revalidatePath(`/teams/${okrResult.value.teamId}/okrs/${okrId}`);
      revalidatePath(`/teams/${okrResult.value.teamId}/okrs`);
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateOkrAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

const updateKeyResultInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  unit: z.string().optional(),
});

export type UpdateKeyResultInput = z.infer<typeof updateKeyResultInputSchema>;

export async function updateKeyResultAction(
  keyResultId: string,
  input: UpdateKeyResultInput,
) {
  try {
    const session = await requireAuth();
    const validInput = updateKeyResultInputSchema.parse(input);

    const result = await updateKeyResult(context, {
      keyResultId: keyResultIdSchema.parse(keyResultId),
      userId: getUserIdFromSession(session),
      ...validInput,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Get OKR and team ID for revalidation
    const keyResult = result.value;
    const okrResult = await context.okrRepository.getById(keyResult.okrId);
    if (okrResult.isOk() && okrResult.value) {
      revalidatePath(
        `/teams/${okrResult.value.teamId}/okrs/${keyResult.okrId}`,
      );
      revalidatePath(`/teams/${okrResult.value.teamId}/okrs`);
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateKeyResultAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteKeyResultAction(keyResultId: string) {
  try {
    const session = await requireAuth();

    // Get key result to verify permissions and get OKR info
    const keyResultResult = await context.keyResultRepository.getById(
      keyResultIdSchema.parse(keyResultId),
    );
    if (keyResultResult.isErr() || !keyResultResult.value) {
      return {
        success: false,
        error: "Key result not found",
      };
    }

    const keyResult = keyResultResult.value;

    // Get OKR to check permissions
    const okrResult = await context.okrRepository.getById(keyResult.okrId);
    if (okrResult.isErr() || !okrResult.value) {
      return {
        success: false,
        error: "OKR not found",
      };
    }

    const okr = okrResult.value;
    const userId = getUserIdFromSession(session);

    // Check permissions: user must be the owner or admin of the team
    const teamMemberResult =
      await context.teamMemberRepository.getByTeamAndUser(okr.teamId, userId);
    if (teamMemberResult.isErr() || !teamMemberResult.value) {
      return {
        success: false,
        error: "User is not a member of this team",
      };
    }

    const teamMember = teamMemberResult.value;
    const isOwner = okr.ownerId === userId;
    const isAdmin = teamMember.role === "admin";
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "Insufficient permissions to delete this key result",
      };
    }

    // Delete the key result
    const deleteResult = await context.keyResultRepository.delete(
      keyResultIdSchema.parse(keyResultId),
    );
    if (deleteResult.isErr()) {
      return {
        success: false,
        error: deleteResult.error.message,
      };
    }

    revalidatePath(`/teams/${okr.teamId}/okrs/${keyResult.okrId}`);
    revalidatePath(`/teams/${okr.teamId}/okrs`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error in deleteKeyResultAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
