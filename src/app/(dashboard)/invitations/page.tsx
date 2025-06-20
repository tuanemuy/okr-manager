import { Calendar, Mail, Users } from "lucide-react";
import { getInvitationsAction } from "@/actions/invitation";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InvitationsPage() {
  const invitationsResult = await getInvitationsAction();

  if (!invitationsResult.success) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">
              {invitationsResult.error || "Error loading invitations"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitations = invitationsResult.data || [];

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">チーム招待</h1>
        <p className="text-muted-foreground">
          保留中のチーム招待を管理してください。
        </p>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              保留中の招待はありません
            </h3>
            <p className="text-muted-foreground text-center">
              現在、保留中のチーム招待はありません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}
    </div>
  );
}
