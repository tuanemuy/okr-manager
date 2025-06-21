import { Bell, Settings } from "lucide-react";
import { Suspense } from "react";
import {
  getNotificationSettingsAction,
  getNotificationsAction,
} from "@/actions/notification";
import { NotificationActions } from "@/components/notifications/NotificationActions";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function NotificationsContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = (searchParams.tab as string) || "all";
  const page = Number.parseInt(searchParams.page as string) || 1;

  const [notificationsResult, settingsResult] = await Promise.all([
    getNotificationsAction({
      page,
      limit: 20,
      unreadOnly: tab === "unread",
    }),
    getNotificationSettingsAction(),
  ]);

  const hasError = !notificationsResult.success || !settingsResult.success;
  const error = notificationsResult.error || settingsResult.error;

  if (hasError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">通知の読み込みエラー: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const notifications = notificationsResult.data || {
    items: [],
    totalCount: 0,
    unreadCount: 0,
  };
  const settings = settingsResult.data || {
    invitations: true,
    reviewReminders: true,
    progressUpdates: true,
    teamUpdates: true,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">通知</h1>
        <NotificationActions unreadCount={notifications.unreadCount} />
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            通知
            {notifications.unreadCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {notifications.unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsList
            notifications={notifications.items}
            totalCount={notifications.totalCount}
            currentPage={page}
            tab={tab}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationSettings settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function NotificationsContentSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="space-y-6">
        <div className="flex space-x-1 border rounded-lg p-1">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => i).map((index) => (
                <div
                  key={`notification-skeleton-${index}`}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function NotificationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<NotificationsContentSkeleton />}>
        <NotificationsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function _NotificationsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近の通知</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => i).map((index) => (
            <div
              key={`notification-skeleton-${index}`}
              className="flex items-start space-x-4 p-4 border rounded-lg"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
