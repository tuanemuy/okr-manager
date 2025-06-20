"use server";

import { revalidatePath } from "next/cache";
import { context } from "@/context";
import { getUserIdFromSession } from "@/lib/session";

export async function updateProfileAction(formData: FormData) {
  const displayName = formData.get("displayName") as string;

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;
  const userId = getUserIdFromSession(session);

  const result = await context.userRepository.update(userId, {
    displayName,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  // Session is managed by Auth.js, no need to manually update

  revalidatePath("/profile");
}

export async function updatePasswordAction(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match");
  }

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
    currentPassword,
    user.hashedPassword,
  );
  if (verifyResult.isErr() || !verifyResult.value) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const hashResult = await context.passwordHasher.hash(newPassword);
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

  revalidatePath("/profile");
}
