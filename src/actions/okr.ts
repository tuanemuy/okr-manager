"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { context } from "@/context";
import { createOkr } from "@/core/application/okr/createOkr";
import { createReview } from "@/core/application/okr/createReview";
import { deleteReview } from "@/core/application/okr/deleteReview";
import { updateKeyResult } from "@/core/application/okr/updateKeyResult";
import { updateKeyResultProgress } from "@/core/application/okr/updateKeyResultProgress";
import { updateOkr } from "@/core/application/okr/updateOkr";
import { updateReview } from "@/core/application/okr/updateReview";
import {
  type KeyResultId,
  keyResultIdSchema,
  type OkrId,
  okrIdSchema,
  type ReviewId,
  reviewIdSchema,
} from "@/core/domain/okr/types";
import { type TeamId, teamIdSchema } from "@/core/domain/team/types";
import { ApplicationError } from "@/lib/error";
import type { FormState } from "@/lib/formState";
import { getUserIdFromSession } from "@/lib/session";
import { validate } from "@/lib/validation";
import { requireAuth } from "./session";

const createOkrFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["team", "personal"]),
  quarter: z.string().regex(/^[1-4]$/),
  year: z.number().min(2000).max(3000),
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

type KeyResultFormData = {
  title: string;
  targetValue: number;
  unit?: string;
};

type CreateOkrFormData = {
  teamId: string;
  title: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  type: FormDataEntryValue | null;
  quarter: FormDataEntryValue | null;
  year: number;
  keyResults: KeyResultFormData[];
};

export async function createOkrAction(
  _prevState: FormState<CreateOkrFormData, { id: string }>,
  formData: FormData,
): Promise<FormState<CreateOkrFormData, { id: string }>> {
  const teamId = formData.get("teamId") as string;
  const rawData = {
    teamId,
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    quarter: formData.get("quarter"),
    year: Number(formData.get("year")),
    keyResults: [] as KeyResultFormData[],
  };

  // Parse key results from form data
  let keyResultIndex = 1;
  while (formData.get(`keyResult-${keyResultIndex}-title`)) {
    const krTitle = formData.get(`keyResult-${keyResultIndex}-title`);
    const krTargetValue = Number(
      formData.get(`keyResult-${keyResultIndex}-targetValue`),
    );
    const krUnit = formData.get(`keyResult-${keyResultIndex}-unit`);

    if (
      krTitle &&
      typeof krTitle === "string" &&
      !Number.isNaN(krTargetValue)
    ) {
      const keyResult: KeyResultFormData = {
        title: krTitle,
        targetValue: krTargetValue,
        unit: krUnit && typeof krUnit === "string" ? krUnit : undefined,
      };
      rawData.keyResults.push(keyResult);
    }
    keyResultIndex++;
  }

  // Validate input
  const validation = validate(createOkrFormSchema, {
    title: rawData.title,
    description: rawData.description || undefined,
    type: rawData.type,
    quarter: rawData.quarter,
    year: rawData.year,
    keyResults: rawData.keyResults,
  });

  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    return {
      input: rawData,
      error: new ApplicationError("Not authenticated"),
    };
  }

  const session = sessionResult.value;

  const teamIdResult = validate(teamIdSchema, teamId);
  if (teamIdResult.isErr()) {
    return {
      input: rawData,
      error: teamIdResult.error,
    };
  }

  const result = await createOkr(context, {
    title: validation.value.title,
    description: validation.value.description,
    type: validation.value.type,
    quarter: {
      year: validation.value.year,
      quarter: Number(validation.value.quarter),
    },
    teamId: teamIdResult.value as TeamId,
    ownerId: getUserIdFromSession(session),
    keyResults: validation.value.keyResults,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  revalidatePath(`/teams/${teamId}/okrs`);
  redirect(`/teams/${teamId}/okrs/${result.value.id}`);
}

const updateKeyResultProgressFormSchema = z.object({
  currentValue: z.number().min(0),
});

export async function updateKeyResultProgressAction(
  keyResultId: string,
  formData: FormData,
) {
  try {
    const currentValue = Number(formData.get("currentValue"));

    // Validate input
    const validationResult = validate(updateKeyResultProgressFormSchema, {
      currentValue,
    });

    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }

    const validInput = validationResult.value;

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;

    const keyResultIdResult = validate(keyResultIdSchema, keyResultId);
    if (keyResultIdResult.isErr()) {
      throw new Error(keyResultIdResult.error.message);
    }

    const result = await updateKeyResultProgress(context, {
      keyResultId: keyResultIdResult.value as KeyResultId,
      currentValue: validInput.currentValue,
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    // Revalidate the OKR page
    const keyResult = result.value;
    const okrResult = await context.okrRepository.getById(keyResult.okrId);
    if (okrResult.isOk() && okrResult.value) {
      revalidatePath(
        `/teams/${okrResult.value.teamId}/okrs/${keyResult.okrId}`,
      );
    }
  } catch (error) {
    console.error("Error in updateKeyResultProgressAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}

const createReviewFormSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["progress", "final"]),
});

export async function createReviewAction(okrId: string, formData: FormData) {
  try {
    const content = formData.get("content");
    const reviewType = formData.get("reviewType");

    // Validate input
    const validationResult = validate(createReviewFormSchema, {
      content,
      type: reviewType,
    });
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    const validInput = validationResult.value;

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;

    const okrIdResult = validate(okrIdSchema, okrId);
    if (okrIdResult.isErr()) {
      throw new Error(okrIdResult.error.message);
    }

    const result = await createReview(context, {
      okrId: okrIdResult.value as OkrId,
      content: validInput.content,
      type: validInput.type,
      reviewerId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    // Get team ID for revalidation
    const okrIdResult2 = validate(okrIdSchema, okrId);
    if (okrIdResult2.isErr()) {
      throw new Error(okrIdResult2.error.message);
    }
    const okrResult = await context.okrRepository.getById(
      okrIdResult2.value as OkrId,
    );
    if (okrResult.isOk() && okrResult.value) {
      revalidatePath(`/teams/${okrResult.value.teamId}/okrs/${okrId}/reviews`);
    }
  } catch (error) {
    console.error("Error in createReviewAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}

export async function getOkrsAction(teamId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const teamIdResult = validate(teamIdSchema, teamId);
  if (teamIdResult.isErr()) {
    throw new Error(teamIdResult.error.message);
  }

  const result = await context.okrRepository.listByTeam(
    teamIdResult.value as TeamId,
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

  const okrIdResult = validate(okrIdSchema, okrId);
  if (okrIdResult.isErr()) {
    throw new Error(okrIdResult.error.message);
  }

  const okrResult = await context.okrRepository.getById(
    okrIdResult.value as OkrId,
  );
  if (okrResult.isErr() || !okrResult.value) {
    throw new Error(
      okrResult.isErr() ? okrResult.error.message : "OKR not found",
    );
  }

  const okrIdResult2 = validate(okrIdSchema, okrId);
  if (okrIdResult2.isErr()) {
    throw new Error(okrIdResult2.error.message);
  }

  const keyResultsResult = await context.keyResultRepository.listByOkr(
    okrIdResult2.value as OkrId,
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

  const okrIdResult = validate(okrIdSchema, okrId);
  if (okrIdResult.isErr()) {
    throw new Error(okrIdResult.error.message);
  }

  const result = await context.reviewRepository.listByOkr(
    okrIdResult.value as OkrId,
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
  const okrIdResult = validate(okrIdSchema, okrId);
  if (okrIdResult.isErr()) {
    throw new Error(okrIdResult.error.message);
  }

  const okrResult = await context.okrRepository.getById(
    okrIdResult.value as OkrId,
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

  const okrIdResult2 = validate(okrIdSchema, okrId);
  if (okrIdResult2.isErr()) {
    throw new Error(okrIdResult2.error.message);
  }

  const result = await context.okrRepository.delete(
    okrIdResult2.value as OkrId,
  );
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  revalidatePath(`/teams/${okr.teamId}/okrs`);
  redirect(`/teams/${okr.teamId}/okrs`);
}

const addKeyResultFormSchema = z.object({
  title: z.string().min(1).max(200),
  targetValue: z.number().min(0),
  unit: z.string().optional(),
});

export async function addKeyResultAction(okrId: string, formData: FormData) {
  try {
    const title = formData.get("title");
    const targetValue = Number(formData.get("targetValue"));
    const unit = formData.get("unit");

    // Validate input
    const validationResult = validate(addKeyResultFormSchema, {
      title,
      targetValue,
      unit: unit || undefined,
    });
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    const validInput = validationResult.value;

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const okrIdResult = validate(okrIdSchema, okrId);
    if (okrIdResult.isErr()) {
      throw new Error(okrIdResult.error.message);
    }

    const result = await context.keyResultRepository.create({
      okrId: okrIdResult.value as OkrId,
      title: validInput.title,
      targetValue: validInput.targetValue,
      currentValue: 0,
      unit: validInput.unit,
    });

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    // Get team ID for revalidation
    const okrIdResult2 = validate(okrIdSchema, okrId);
    if (okrIdResult2.isErr()) {
      throw new Error(okrIdResult2.error.message);
    }

    const okrResult = await context.okrRepository.getById(
      okrIdResult2.value as OkrId,
    );
    if (okrResult.isOk() && okrResult.value) {
      revalidatePath(`/teams/${okrResult.value.teamId}/okrs/${okrId}`);
    }
  } catch (error) {
    console.error("Error in addKeyResultAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
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
    const validationResult = validate(updateOkrInputSchema, input);
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    const validInput = validationResult.value;

    const okrIdResult = validate(okrIdSchema, okrId);
    if (okrIdResult.isErr()) {
      throw new Error(okrIdResult.error.message);
    }

    const result = await updateOkr(context, {
      okrId: okrIdResult.value as OkrId,
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
    const okrIdResult2 = validate(okrIdSchema, okrId);
    if (okrIdResult2.isErr()) {
      throw new Error(okrIdResult2.error.message);
    }

    const okrResult = await context.okrRepository.getById(
      okrIdResult2.value as OkrId,
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
    const validationResult = validate(updateKeyResultInputSchema, input);
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    const validInput = validationResult.value;

    const keyResultIdResult = validate(keyResultIdSchema, keyResultId);
    if (keyResultIdResult.isErr()) {
      throw new Error(keyResultIdResult.error.message);
    }

    const result = await updateKeyResult(context, {
      keyResultId: keyResultIdResult.value as KeyResultId,
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
    const keyResultIdResult = validate(keyResultIdSchema, keyResultId);
    if (keyResultIdResult.isErr()) {
      return {
        success: false,
        error: keyResultIdResult.error.message,
      };
    }

    const keyResultResult = await context.keyResultRepository.getById(
      keyResultIdResult.value as KeyResultId,
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
    const keyResultIdResult2 = validate(keyResultIdSchema, keyResultId);
    if (keyResultIdResult2.isErr()) {
      return {
        success: false,
        error: keyResultIdResult2.error.message,
      };
    }

    const deleteResult = await context.keyResultRepository.delete(
      keyResultIdResult2.value as KeyResultId,
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

export async function getReviewAction(reviewId: string) {
  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const reviewIdResult = validate(reviewIdSchema, reviewId);
  if (reviewIdResult.isErr()) {
    throw new Error(reviewIdResult.error.message);
  }

  const result = await context.reviewRepository.findById(
    reviewIdResult.value as ReviewId,
  );

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  if (!result.value) {
    throw new Error("Review not found");
  }

  return result.value;
}

const updateReviewInputSchema = z.object({
  content: z.string().min(1),
});

export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;

export async function updateReviewAction(
  reviewId: string,
  input: UpdateReviewInput,
) {
  try {
    const session = await requireAuth();
    const validationResult = validate(updateReviewInputSchema, input);
    if (validationResult.isErr()) {
      throw new Error(validationResult.error.message);
    }
    const validInput = validationResult.value;

    const reviewIdResult = validate(reviewIdSchema, reviewId);
    if (reviewIdResult.isErr()) {
      throw new Error(reviewIdResult.error.message);
    }

    const result = await updateReview(context, {
      reviewId: reviewIdResult.value as ReviewId,
      userId: getUserIdFromSession(session),
      ...validInput,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    // Get review and OKR for revalidation
    const reviewIdResult2 = validate(reviewIdSchema, reviewId);
    if (reviewIdResult2.isErr()) {
      throw new Error(reviewIdResult2.error.message);
    }

    const reviewResult = await context.reviewRepository.findById(
      reviewIdResult2.value as ReviewId,
    );
    if (reviewResult.isOk() && reviewResult.value) {
      const okrResult = await context.okrRepository.getById(
        reviewResult.value.okrId,
      );
      if (okrResult.isOk() && okrResult.value) {
        revalidatePath(
          `/teams/${okrResult.value.teamId}/okrs/${reviewResult.value.okrId}/reviews/${reviewId}`,
        );
        revalidatePath(
          `/teams/${okrResult.value.teamId}/okrs/${reviewResult.value.okrId}/reviews`,
        );
      }
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateReviewAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    const session = await requireAuth();

    // Get review to check permissions and get IDs for revalidation
    const reviewIdResult = validate(reviewIdSchema, reviewId);
    if (reviewIdResult.isErr()) {
      return {
        success: false,
        error: reviewIdResult.error.message,
      };
    }

    const reviewResult = await context.reviewRepository.findById(
      reviewIdResult.value as ReviewId,
    );
    if (reviewResult.isErr() || !reviewResult.value) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    const review = reviewResult.value;

    // Get OKR to check permissions
    const okrResult = await context.okrRepository.getById(review.okrId);
    if (okrResult.isErr() || !okrResult.value) {
      return {
        success: false,
        error: "OKR not found",
      };
    }

    const reviewIdResult2 = validate(reviewIdSchema, reviewId);
    if (reviewIdResult2.isErr()) {
      return {
        success: false,
        error: reviewIdResult2.error.message,
      };
    }

    const result = await deleteReview(context, {
      reviewId: reviewIdResult2.value as ReviewId,
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    const okr = okrResult.value;
    revalidatePath(`/teams/${okr.teamId}/okrs/${review.okrId}/reviews`);
    revalidatePath(`/teams/${okr.teamId}/okrs/${review.okrId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error in deleteReviewAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
