"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markAllNotificationsAsReadAction } from "@/actions/notification";
import { Button } from "@/components/ui/button";

interface NotificationActionsProps {
  unreadCount: number;
}

export function NotificationActions({ unreadCount }: NotificationActionsProps) {
  const router = useRouter();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingAll(true);

    const result = await markAllNotificationsAsReadAction();

    setIsMarkingAll(false);

    if (result.success) {
      router.refresh();
    }
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleMarkAllAsRead}
      disabled={isMarkingAll}
      className="flex items-center gap-2"
    >
      <CheckCheck className="h-4 w-4" />
      {isMarkingAll ? "Marking all as read..." : "Mark all as read"}
    </Button>
  );
}
