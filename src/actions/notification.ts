"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { context } from "@/context";
import { getNotificationsByUserId } from "@/core/application/notification/getNotificationsByUserId";
import { getUserNotificationSettings } from "@/core/application/notification/getUserNotificationSettings";
import { markAllNotificationsAsRead } from "@/core/application/notification/markAllNotificationsAsRead";
import { markNotificationAsRead } from "@/core/application/notification/markNotificationAsRead";
import { updateUserNotificationSettings } from "@/core/application/notification/updateUserNotificationSettings";
import { getUserIdFromSession } from "@/lib/session";
import { requireAuth } from "./session";

const getNotificationsInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  unreadOnly: z.boolean().default(false),
});

export type GetNotificationsInput = z.infer<typeof getNotificationsInputSchema>;

export async function getNotificationsAction(input: GetNotificationsInput) {
  try {
    const session = await requireAuth();
    const validInput = getNotificationsInputSchema.parse(input);

    const result = await getNotificationsByUserId(context, {
      userId: getUserIdFromSession(session),
      pagination: {
        page: validInput.page,
        limit: validInput.limit,
        order: "desc" as const,
        orderBy: "createdAt",
      },
      unreadOnly: validInput.unreadOnly,
    });

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
    console.error("Error in getNotificationsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const session = await requireAuth();

    const result = await markNotificationAsRead(context, {
      notificationId,
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath("/notifications");
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in markNotificationAsReadAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const session = await requireAuth();

    const result = await markAllNotificationsAsRead(context, {
      userId: getUserIdFromSession(session),
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath("/notifications");
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in markAllNotificationsAsReadAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

const updateNotificationSettingsInputSchema = z.object({
  invitations: z.boolean(),
  reviewReminders: z.boolean(),
  progressUpdates: z.boolean(),
  teamUpdates: z.boolean(),
});

export type UpdateNotificationSettingsInput = z.infer<
  typeof updateNotificationSettingsInputSchema
>;

export async function getNotificationSettingsAction() {
  try {
    const session = await requireAuth();

    const result = await getUserNotificationSettings(context, {
      userId: getUserIdFromSession(session),
    });

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
    console.error("Error in getNotificationSettingsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateNotificationSettingsAction(
  input: UpdateNotificationSettingsInput,
) {
  try {
    const session = await requireAuth();
    const validInput = updateNotificationSettingsInputSchema.parse(input);

    const result = await updateUserNotificationSettings(context, {
      userId: getUserIdFromSession(session),
      settings: validInput,
    });

    if (result.isErr()) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    revalidatePath("/notifications");
    return {
      success: true,
      data: result.value,
    };
  } catch (error) {
    console.error("Error in updateNotificationSettingsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
