import Link from "next/link";
import { getTeamsAction } from "@/actions/team";
import { CreateTeamDialog } from "@/components/team/CreateTeamDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamsPage() {
  const teamsResult = await getTeamsAction();
  const teams = teamsResult.success ? teamsResult.data?.teams || [] : [];
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">チーム一覧</h1>
          <p className="text-muted-foreground">
            参加しているチームを管理しましょう
          </p>
        </div>
        <CreateTeamDialog>
          <Button>新しいチーム作成</Button>
        </CreateTeamDialog>
      </div>

      <div className="main">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>
                      {team.description || "説明がありません"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">メンバー</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">作成日</span>
                    <span className="font-medium">
                      {new Date(team.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <Link href={`/teams/${team.id}`}>
                    <Button variant="outline" className="w-full">
                      チーム詳細
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create Team Card */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  新しいチームを作成
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  チームを作成してOKRの管理を始めましょう
                </p>
                <CreateTeamDialog>
                  <Button>チーム作成</Button>
                </CreateTeamDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invitations Section */}
        <div className="mt-12">
          <h2 className="text-lg font-medium mb-4">招待</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                現在、保留中の招待はありません
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
