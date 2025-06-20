import { Mail, MoreHorizontal, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";
import { getTeamAction, getTeamMembersAction } from "@/actions/team";
import { InviteMemberForm } from "@/components/team/invite-member-form";
import { MemberActionsMenu } from "@/components/team/member-actions-menu";
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

export default async function TeamMembersPage({
  params,
}: {
  params: { teamId: string };
}) {
  const [teamResult, teamMembersResult] = await Promise.all([
    getTeamAction(params.teamId),
    getTeamMembersAction(params.teamId),
  ]);

  if (!teamResult.success) {
    notFound();
  }

  if (!teamResult.data) {
    return <div>Team not found</div>;
  }

  const team = teamResult.data;
  const teamMembers = teamMembersResult.success
    ? teamMembersResult.data
    : { items: [], totalCount: 0 };

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
          <InviteMemberForm teamId={params.teamId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            メンバー一覧 ({teamMembers?.items?.length || 0}人)
          </CardTitle>
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
              {teamMembers?.items?.map((member) => {
                const initials = member.user.displayName
                  .split(" ")
                  .map((n: string) => n[0])
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
                      <MemberActionsMenu
                        teamId={params.teamId}
                        member={member}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {(teamMembers?.items?.length || 0) === 0 && (
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
