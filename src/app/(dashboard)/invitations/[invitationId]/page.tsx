import { ArrowLeft, Calendar, Mail, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvitationAction } from "@/actions/invitation";
import { InvitationActions } from "@/components/invitation/invitation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InvitationDetailPage({
  params,
}: {
  params: { invitationId: string };
}) {
  const invitationResult = await getInvitationAction(params.invitationId);

  if (!invitationResult.success) {
    notFound();
  }

  if (!invitationResult.data) {
    return <div>Invitation not found</div>;
  }

  const invitation = invitationResult.data;

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: "管理者",
      member: "メンバー",
      viewer: "閲覧者",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "保留中", variant: "secondary" as const },
      accepted: { label: "承認済み", variant: "default" as const },
      rejected: { label: "拒否済み", variant: "destructive" as const },
    };
    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: "secondary" as const,
      }
    );
  };

  const statusInfo = getStatusBadge(invitation.status);

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/invitations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            招待一覧に戻る
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">招待詳細</h1>
        <p className="text-muted-foreground">
          チーム招待の詳細を確認してください。
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {invitation.team.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {invitation.invitedBy.displayName}（{invitation.invitedBy.email}
                ） からの招待
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="outline">{getRoleBadge(invitation.role)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Team Description */}
            {invitation.team.description && (
              <div>
                <h3 className="font-semibold mb-2">チームについて</h3>
                <p className="text-muted-foreground">
                  {invitation.team.description}
                </p>
              </div>
            )}

            {/* Invitation Details */}
            <div>
              <h3 className="font-semibold mb-3">招待詳細</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    招待されたメール: {invitation.invitedEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    招待日時: {invitation.createdAt.toLocaleDateString("ja-JP")}{" "}
                    {invitation.createdAt.toLocaleTimeString("ja-JP")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    役割: {getRoleBadge(invitation.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Description */}
            <div>
              <h3 className="font-semibold mb-2">役割について</h3>
              <div className="text-sm text-muted-foreground">
                {invitation.role === "admin" && (
                  <p>
                    管理者はチームの全ての機能にアクセスでき、メンバーの管理やチーム設定の変更ができます。
                  </p>
                )}
                {invitation.role === "member" && (
                  <p>
                    メンバーはOKRの作成・編集・レビューができ、チームの目標達成に貢献できます。
                  </p>
                )}
                {invitation.role === "viewer" && (
                  <p>
                    閲覧者はチームのOKRや進捗を確認できますが、編集権限はありません。
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {invitation.status === "pending" && (
              <div>
                <h3 className="font-semibold mb-3">アクション</h3>
                <InvitationActions invitation={invitation} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
