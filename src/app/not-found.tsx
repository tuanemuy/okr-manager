import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-gray-500" />
            <CardTitle>ページが見つかりません</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            お探しのページは存在しないか、移動または削除された可能性があります。
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/">ホームに戻る</Link>
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
