import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Settings } from "lucide-react";

export default function TeamDetailPage({
  params,
}: {
  params: { teamId: string };
}) {
  // TODO: Fetch team data using server actions
  const team = {
    id: params.teamId,
    name: "Engineering Team",
    description: "Product development and engineering excellence",
    memberCount: 8,
    okrCount: 12,
    adminCount: 2,
  };

  const stats = [
    {
      title: "メンバー数",
      value: team.memberCount,
      icon: Users,
    },
    {
      title: "OKR数",
      value: team.okrCount,
      icon: Target,
    },
    {
      title: "管理者数",
      value: team.adminCount,
      icon: Settings,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground mt-2">{team.description}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/teams/${team.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/teams/${team.id}/okrs`}>
                <Target className="h-4 w-4 mr-2" />
                OKR管理
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              メンバー
              <Button size="sm" asChild>
                <Link href={`/teams/${team.id}/members`}>
                  メンバー管理
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* TODO: Implement member list */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    JD
                  </div>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">john@example.com</p>
                  </div>
                </div>
                <Badge variant="outline">管理者</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium">
                    JS
                  </div>
                  <div>
                    <p className="font-medium">Jane Smith</p>
                    <p className="text-sm text-muted-foreground">jane@example.com</p>
                  </div>
                </div>
                <Badge variant="secondary">メンバー</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              最近のOKR
              <Button size="sm" asChild>
                <Link href={`/teams/${team.id}/okrs`}>
                  すべて見る
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* TODO: Implement recent OKRs list */}
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Q1 プロダクト開発</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  新機能のリリースと品質向上
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">進行中</Badge>
                  <span className="text-sm font-medium">75%</span>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">チーム生産性向上</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  開発効率とコードクオリティの改善
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">進行中</Badge>
                  <span className="text-sm font-medium">60%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}