"use server";

import { context } from "@/context";
import { getDashboardData } from "@/core/application/dashboard/getDashboardData";
import { type UserId, userIdSchema } from "@/core/domain/user/types";
import { validate } from "@/lib/validation";
import { requireAuth } from "./session";

export async function getDashboardDataAction() {
  try {
    const session = await requireAuth();

    const validationResult = validate(userIdSchema, session.user.id);
    if (validationResult.isErr()) {
      return {
        success: false,
        error: "Invalid user ID format",
      };
    }
    const userId = validationResult.value as UserId;
    const result = await getDashboardData(context, userId);

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in getDashboardDataAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
