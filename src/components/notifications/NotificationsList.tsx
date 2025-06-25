"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markNotificationAsReadAction } from "@/actions/notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsPagination } from "./NotificationsPagination";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface NotificationsListProps {
  notifications: Notification[];
  totalCount: number;
  currentPage: number;
  tab: string;
}

export function NotificationsList({
  notifications,
  totalCount,
  currentPage,
  tab,
}: NotificationsListProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const handleMarkAsRead = async (notificationId: string) => {
    setLoadingIds((prev) => new Set(prev).add(notificationId));

    const result = await markNotificationAsReadAction(notificationId);

    setLoadingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });

    if (result.success) {
      router.refresh();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invitation":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "review_reminder":
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case "progress_update":
        return <Target className="h-5 w-5 text-green-500" />;
      case "team_update":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "deadline_alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "invitation":
        return "チーム招待";
      case "review_reminder":
        return "レビューリマインダー";
      case "progress_update":
        return "進捗更新";
      case "team_update":
        return "チーム更新";
      case "deadline_alert":
        return "期限アラート";
      default:
        return "通知";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近の通知</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={tab} className="space-y-4">
          <TabsList>
            <TabsTrigger
              value="all"
              onClick={() => router.push("/notifications?tab=all")}
            >
              すべての通知
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              onClick={() => router.push("/notifications?tab=unread")}
            >
              未読
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {tab === "unread"
                    ? "未読の通知はありません"
                    : "通知はありません"}
                </h3>
                <p className="text-gray-500">
                  {tab === "unread"
                    ? "すべて確認済みです！"
                    : "新しい通知がここに表示されます。"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
                      notification.isRead
                        ? "bg-white"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                            {!notification.isRead && (
                              <Badge
                                variant="default"
                                className="bg-blue-500 text-xs"
                              >
                                新着
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                            {notification.isRead && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                既読
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={loadingIds.has(notification.id)}
                            >
                              {loadingIds.has(notification.id)
                                ? "処理中..."
                                : "既読にする"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalCount > 20 && (
              <div className="mt-6">
                <NotificationsPagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={20}
                  tab={tab}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
