import { getTeamAction, getTeamMembersAction } from "@/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, MoreHorizontal, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";

export default async function TeamMembersPage({
  params,
}: {
  params: { teamId: string };
}) {
  const [team, teamMembers] = await Promise.all([
    getTeamAction(params.teamId),
    getTeamMembersAction(params.teamId),
  ]);

  if (!team) {
    notFound();
  }

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: "管理者",
      member: "メンバー",
      viewer: "閲覧者",
    };
    return (
      <Badge variant={role === "admin" ? "default" : "secondary"}>
        {roleMap[role as keyof typeof roleMap] || role}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">メンバー管理</h1>
        <p className="text-muted-foreground mt-2">チームメンバーの一覧と管理</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            新しいメンバーを招待
            <UserPlus className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="招待するメールアドレス"
              type="email"
              className="flex-1"
            />
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              招待を送信
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>メンバー一覧 ({teamMembers.items.length}人)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>役割</TableHead>
                <TableHead>参加日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.items.map((member) => {
                const initials = member.user.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                          {initials}
                        </div>
                        <span className="font-medium">
                          {member.user.displayName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {member.joinedAt.toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>役割を変更</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            メンバーを削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {teamMembers.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    メンバーがいません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
