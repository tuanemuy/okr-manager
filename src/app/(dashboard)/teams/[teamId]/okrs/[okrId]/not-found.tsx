import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import Link from "next/link";

export default function OkrNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-500" />
            <CardTitle>OKRが見つかりません</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            指定されたOKRは存在しないか、アクセス権限がありません。
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href=".">OKR一覧</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">ダッシュボード</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
