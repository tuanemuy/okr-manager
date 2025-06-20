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
import { Bell, Settings } from "lucide-react";
import { Suspense } from "react";

export default async function NotificationsPage({
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
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading notifications: {error}</p>
          </CardContent>
        </Card>
      </div>
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <NotificationActions unreadCount={notifications.unreadCount} />
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
            {notifications.unreadCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {notifications.unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Suspense fallback={<NotificationsListSkeleton />}>
            <NotificationsList
              notifications={notifications.items}
              totalCount={notifications.totalCount}
              currentPage={page}
              tab={tab}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationSettings settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
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
