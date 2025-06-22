"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { context } from "@/context";
import { getUserIdFromSession } from "@/lib/session";

const updateProfileFormSchema = z.object({
  displayName: z.string().min(1).max(100),
});

export async function updateProfileAction(formData: FormData) {
  try {
    const displayName = formData.get("displayName");

    // Validate input
    const validInput = updateProfileFormSchema.parse({
      displayName,
    });

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;
    const userId = getUserIdFromSession(session);

    const result = await context.userRepository.update(userId, {
      displayName: validInput.displayName,
    });

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    // Update session to reflect the latest user data immediately
    const updateSessionResult = await context.sessionManager.update();
    if (updateSessionResult.isErr()) {
      console.error("Failed to update session:", updateSessionResult.error);
    }

    // Revalidate all pages to refresh session data everywhere
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Error in updateProfileAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
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

export async function updatePasswordAction(formData: FormData) {
  try {
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    // Validate input
    const validInput = updatePasswordFormSchema.parse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    const sessionResult = await context.sessionManager.get();
    if (sessionResult.isErr() || !sessionResult.value) {
      throw new Error("Not authenticated");
    }

    const session = sessionResult.value;
    const userId = getUserIdFromSession(session);

    // Get current user to verify current password
    const userResult = await context.userRepository.getById(userId);
    if (userResult.isErr() || !userResult.value) {
      throw new Error("User not found");
    }

    const user = userResult.value;

    // Verify current password
    const verifyResult = await context.passwordHasher.verify(
      validInput.currentPassword,
      user.hashedPassword,
    );
    if (verifyResult.isErr() || !verifyResult.value) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashResult = await context.passwordHasher.hash(
      validInput.newPassword,
    );
    if (hashResult.isErr()) {
      throw new Error("Failed to hash new password");
    }

    // Update password
    const updateResult = await context.userRepository.update(userId, {
      hashedPassword: hashResult.value,
    });

    if (updateResult.isErr()) {
      throw new Error(updateResult.error.message);
    }

    // Revalidate all pages to refresh session data everywhere
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("Error in updatePasswordAction:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}
