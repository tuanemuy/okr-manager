"use server";

import { context } from "@/context";
import { createOkr } from "@/core/application/okr/createOkr";
import { createReview } from "@/core/application/okr/createReview";
import { updateKeyResultProgress } from "@/core/application/okr/updateKeyResultProgress";
import {
  type OkrType,
  keyResultIdSchema,
  okrIdSchema,
} from "@/core/domain/okr/types";
import { teamIdSchema } from "@/core/domain/team/types";
import { getUserIdFromSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOkrAction(teamId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as OkrType;
  const quarter = formData.get("quarter") as string;
  const year = Number(formData.get("year"));

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await createOkr(context, {
    title,
    description: description || undefined,
    type,
    quarter: {
      year,
      quarter: Number(quarter),
    },
    teamId: teamIdSchema.parse(teamId),
    ownerId: getUserIdFromSession(session),
    keyResults: [], // Will be added separately
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
