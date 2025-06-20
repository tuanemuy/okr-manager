import { Plus, Target, User, Users } from "lucide-react";
import Link from "next/link";
import { getOkrsAction } from "@/actions/okr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function TeamOkrsPage({
  params,
}: {
  params: { teamId: string };
}) {
  const okrs = await getOkrsAction(params.teamId);

  const _getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">進行中</Badge>;
      case "completed":
        return <Badge variant="secondary">完了</Badge>;
      case "paused":
        return <Badge variant="outline">一時停止</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "team" ? (
      <Badge variant="outline" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        チーム
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        個人
      </Badge>
    );
  };

  const _getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">OKR管理</h1>
            <p className="text-muted-foreground mt-2">
              チームと個人のOKRを管理
            </p>
          </div>
          <Button asChild>
            <Link href={`/teams/${params.teamId}/okrs/new`}>
              <Plus className="h-4 w-4 mr-2" />
              新しいOKR
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input placeholder="OKRを検索..." className="md:max-w-sm" />
            <Select defaultValue="all">
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての期間</SelectItem>
                <SelectItem value="2024-q1">2024 Q1</SelectItem>
                <SelectItem value="2024-q2">2024 Q2</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="team">チーム</SelectItem>
                <SelectItem value="personal">個人</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {okrs.map((okr) => (
          <Card key={okr.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">{okr.title}</h3>
                    {getTypeBadge(okr.type)}
                    <Badge variant="default">進行中</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {okr.description || "説明がありません"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>
                      期間: {okr.quarterYear} Q{okr.quarterQuarter}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/teams/${params.teamId}/okrs/${okr.id}`}>
                    詳細を見る
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">進捗</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all duration-300 bg-gray-400"
                  style={{ width: "0%" }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {okrs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">OKRがありません</h3>
            <p className="text-muted-foreground mb-4">
              最初のOKRを作成して目標管理を始めましょう
            </p>
            <Button asChild>
              <Link href={`/teams/${params.teamId}/okrs/new`}>
                <Plus className="h-4 w-4 mr-2" />
                新しいOKR
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
