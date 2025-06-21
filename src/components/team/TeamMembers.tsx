import Link from "next/link";
import { getTeamMembersAction } from "@/actions/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamMembersProps {
  teamId: string;
}

export default async function TeamMembers({ teamId }: TeamMembersProps) {
  const teamMembersResult = await getTeamMembersAction(teamId);
  const teamMembers = teamMembersResult.success
    ? teamMembersResult.data
    : { items: [], totalCount: 0 };

  const roleDisplayMap: Record<string, string> = {
    admin: "管理者",
    member: "メンバー",
    viewer: "閲覧者",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          メンバー
          <Button size="sm" asChild>
            <Link href={`/teams/${teamId}/members`}>メンバー管理</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers?.items?.slice(0, 3).map((member) => {
            const initials = member.user.displayName
              .split(" ")
              .map((name: string) => name[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {initials}
                  </div>
                  <div>
                    <p className="font-medium">{member.user.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={member.role === "admin" ? "outline" : "secondary"}
                >
                  {roleDisplayMap[member.role] || member.role}
                </Badge>
              </div>
            );
          })}
          {(teamMembers?.items?.length || 0) === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              メンバーがいません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
