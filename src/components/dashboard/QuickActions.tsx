import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { getDashboardDataAction } from "@/actions/dashboard";
import { Button } from "@/components/ui/button";

export default async function QuickActions() {
  const dashboardResult = await getDashboardDataAction();
  const dashboardData = dashboardResult.success ? dashboardResult.data : null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-medium text-gray-900">
          クイックアクション
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/teams" className="block">
          <Button className="h-20 flex flex-col space-y-1 w-full">
            <span className="text-sm font-medium">新しいチーム</span>
            <span className="text-xs opacity-75">チームを作成</span>
          </Button>
        </Link>
        {dashboardData?.teams && dashboardData.teams.length > 0 && (
          <Link
            href={`/teams/${dashboardData.teams[0].id}/okrs/new`}
            className="block"
          >
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-1 w-full"
            >
              <span className="text-sm font-medium">OKR作成</span>
              <span className="text-xs opacity-75">新しい目標を設定</span>
            </Button>
          </Link>
        )}
        <Link href="/search?type=okr" className="block">
          <Button
            variant="outline"
            className="h-20 flex flex-col space-y-1 w-full"
          >
            <span className="text-sm font-medium">OKR検索</span>
            <span className="text-xs opacity-75">OKRを検索・閲覧</span>
          </Button>
        </Link>
        <Link href="/invitations" className="block">
          <Button
            variant="outline"
            className="h-20 flex flex-col space-y-1 w-full"
          >
            <span className="text-sm font-medium">招待確認</span>
            <span className="text-xs opacity-75">チーム招待を確認</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
