import {
  acceptInvitationAction,
  rejectInvitationAction,
} from "@/actions/invitation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { context } from "@/context";
import { getUserEmailFromSession } from "@/lib/session";
import { Calendar, Mail, Users } from "lucide-react";

export default async function InvitationsPage() {
  const sessionResult = await context.sessionManager.get();

  if (sessionResult.isErr() || !sessionResult.value) {
    return <div>Not authenticated</div>;
  }

  const session = sessionResult.value;

  const invitationsResult = await context.invitationRepository.listByEmail(
    getUserEmailFromSession(session),
  );
  if (invitationsResult.isErr()) {
    return <div>Error loading invitations</div>;
  }

  const invitations = invitationsResult.value.filter(
    (inv) => inv.status === "pending",
  );

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Invitations</h1>
        <p className="text-muted-foreground">
          Manage your pending team invitations.
        </p>
      </div>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No pending invitations
            </h3>
            <p className="text-muted-foreground text-center">
              You don't have any pending team invitations at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Invitation
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4" />
                      Invited on {invitation.createdAt.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Invitation Details</h4>
                    <p className="text-sm text-muted-foreground">
                      You've been invited to join a team. Team ID:{" "}
                      {invitation.teamId}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <form
                      action={acceptInvitationAction.bind(null, invitation.id)}
                    >
                      <Button type="submit" size="sm">
                        Accept Invitation
                      </Button>
                    </form>
                    <form
                      action={rejectInvitationAction.bind(null, invitation.id)}
                    >
                      <Button type="submit" variant="outline" size="sm">
                        Decline
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
