"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { markAllNotificationsAsReadAction } from "@/actions/notification";
import { Button } from "@/components/ui/button";
import { useToastAction } from "@/lib/use-toast-action";

interface NotificationActionsProps {
  unreadCount: number;
}

export function NotificationActions({ unreadCount }: NotificationActionsProps) {
  const router = useRouter();
  const { isLoading, executeAction } = useToastAction({
    successMessage: "すべての通知を既読にしました",
    errorMessage: "通知の既読処理に失敗しました",
  });

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    await executeAction(
      async () => {
        const result = await markAllNotificationsAsReadAction();
        if (!result.success) {
          throw new Error(result.error || "通知の既読処理に失敗しました");
        }
        return result;
      },
      {
        onSuccess: () => {
          router.refresh();
        },
      },
    );
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleMarkAllAsRead}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <CheckCheck className="h-4 w-4" />
      {isLoading ? "すべて既読にしています..." : "すべて既読にする"}
    </Button>
  );
}
