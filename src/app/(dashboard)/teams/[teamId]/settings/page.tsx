import { AlertTriangle, Clock, Settings } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/actions/session";
import {
  getTeamAction,
  getTeamMemberCountAction,
  getUserTeamRoleAction,
} from "@/actions/team";
import { TeamBasicSettings } from "@/components/team/TeamBasicSettings";
import { TeamDangerZone } from "@/components/team/TeamDangerZone";
import { TeamReviewSettings } from "@/components/team/TeamReviewSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamSettingsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

export default async function TeamSettingsPage({
  params,
}: TeamSettingsPageProps) {
  const { teamId } = await params;
  const _session = await requireAuth();

  const [teamResult, userRoleResult, memberCountResult] = await Promise.all([
    getTeamAction(teamId),
    getUserTeamRoleAction(teamId),
    getTeamMemberCountAction(teamId),
  ]);

  if (!teamResult.success) {
    notFound();
  }

  if (!teamResult.data) {
    return <div>Team not found</div>;
  }

  const team = teamResult.data;
  const userRole = userRoleResult.success ? userRoleResult.data : null;
  const memberCount = memberCountResult.success
    ? memberCountResult.data || 0
    : 0;
  const isAdmin = userRole === "admin";

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Team Settings</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              You don't have permission to access team settings. Only team
              administrators can modify settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Settings</h1>
        <p className="text-gray-600">
          Manage settings for <span className="font-medium">{team.name}</span>
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Review Settings
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamBasicSettings
                team={{
                  id: team.id,
                  name: team.name,
                  description: team.description || null,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Review Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamReviewSettings
                team={{
                  id: team.id,
                  reviewFrequency: "monthly" as const,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamDangerZone
                team={{
                  id: team.id,
                  name: team.name,
                  memberCount,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
