"use server";

import { userIdSchema } from "@/core/domain/user/types";
import { revalidatePath } from "next/cache";
import { context } from "./context";

export async function updateProfileAction(formData: FormData) {
  const displayName = formData.get("displayName") as string;

  const sessionResult = await context.sessionManager.get();
  if (sessionResult.isErr() || !sessionResult.value) {
    throw new Error("Not authenticated");
  }

  const session = sessionResult.value;

  const result = await context.userRepository.update(session.userId, {
    displayName,
  });

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  // Update session with new display name
  const updateSessionResult = await context.sessionManager.create({
    userId: session.userId,
    email: session.email,
    displayName,
  });

  if (updateSessionResult.isErr()) {
    console.error("Failed to update session:", updateSessionResult.error);
  }

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

  // Get current user to verify current password
  const userResult = await context.userRepository.getById(session.userId);
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
  const updateResult = await context.userRepository.update(session.userId, {
    hashedPassword: hashResult.value,
  });

  if (updateResult.isErr()) {
    throw new Error(updateResult.error.message);
  }

  revalidatePath("/profile");
}
