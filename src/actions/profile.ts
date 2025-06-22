"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { context } from "@/context";
import { ApplicationError } from "@/lib/error";
import type { FormState } from "@/lib/formState";
import { getUserIdFromSession } from "@/lib/session";
import { validate } from "@/lib/validation";

const updateProfileFormSchema = z.object({
  displayName: z.string().min(1).max(100),
});

type UpdateProfileFormData = {
  displayName: FormDataEntryValue | null;
};

export async function updateProfileAction(
  _prevState: FormState<UpdateProfileFormData, { success: boolean }>,
  formData: FormData,
): Promise<FormState<UpdateProfileFormData, { success: boolean }>> {
  const rawData = {
    displayName: formData.get("displayName"),
  };

  const validation = validate(updateProfileFormSchema, rawData);
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
  const userId = getUserIdFromSession(session);

  const result = await context.userRepository.update(userId, {
    displayName: validation.value.displayName,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Update session to reflect the latest user data immediately
  const updateSessionResult = await context.sessionManager.update();
  if (updateSessionResult.isErr()) {
    console.error("Failed to update session:", updateSessionResult.error);
  }

  // Revalidate all pages to refresh session data everywhere
  revalidatePath("/", "layout");

  return {
    input: rawData,
    result: { success: true },
    error: null,
  };
}

const updatePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormData = {
  currentPassword: FormDataEntryValue | null;
  newPassword: FormDataEntryValue | null;
  confirmPassword: FormDataEntryValue | null;
};

export async function updatePasswordAction(
  _prevState: FormState<UpdatePasswordFormData, { success: boolean }>,
  formData: FormData,
): Promise<FormState<UpdatePasswordFormData, { success: boolean }>> {
  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = validate(updatePasswordFormSchema, rawData);
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
  const userId = getUserIdFromSession(session);

  // Get current user to verify current password
  const userResult = await context.userRepository.getById(userId);
  if (userResult.isErr() || !userResult.value) {
    return {
      input: rawData,
      error: new ApplicationError("User not found"),
    };
  }

  const user = userResult.value;

  // Verify current password
  const verifyResult = await context.passwordHasher.verify(
    validation.value.currentPassword,
    user.hashedPassword,
  );
  if (verifyResult.isErr() || !verifyResult.value) {
    return {
      input: rawData,
      error: new ApplicationError("Current password is incorrect"),
    };
  }

  // Hash new password
  const hashResult = await context.passwordHasher.hash(
    validation.value.newPassword,
  );
  if (hashResult.isErr()) {
    return {
      input: rawData,
      error: new ApplicationError("Failed to hash new password"),
    };
  }

  // Update password
  const updateResult = await context.userRepository.update(userId, {
    hashedPassword: hashResult.value,
  });

  if (updateResult.isErr()) {
    return {
      input: rawData,
      error: updateResult.error,
    };
  }

  // Revalidate all pages to refresh session data everywhere
  revalidatePath("/", "layout");

  return {
    input: rawData,
    result: { success: true },
    error: null,
  };
}
