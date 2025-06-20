"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  type UpdateNotificationSettingsInput,
  updateNotificationSettingsAction,
} from "@/actions/notification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  settings: {
    invitations: boolean;
    reviewReminders: boolean;
    progressUpdates: boolean;
    teamUpdates: boolean;
  };
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
  const router = useRouter();
  const [formData, setFormData] =
    useState<UpdateNotificationSettingsInput>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    const result = await updateNotificationSettingsAction(formData);

    setIsSaving(false);

    if (result.success) {
      router.refresh();
    }
  };

  const handleToggle = (key: keyof UpdateNotificationSettingsInput) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
          <CardDescription>
            Get notified when you're invited to join a team or when invitation
            status changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="invitations"
              checked={formData.invitations}
              onCheckedChange={() => handleToggle("invitations")}
            />
            <Label htmlFor="invitations">
              Receive invitation notifications
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Reminders</CardTitle>
          <CardDescription>
            Get reminded when it's time to review your OKRs or when reviews are
            due.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="reviewReminders"
              checked={formData.reviewReminders}
              onCheckedChange={() => handleToggle("reviewReminders")}
            />
            <Label htmlFor="reviewReminders">
              Receive review reminder notifications
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Updates</CardTitle>
          <CardDescription>
            Get notified when team members update their OKR progress or key
            results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="progressUpdates"
              checked={formData.progressUpdates}
              onCheckedChange={() => handleToggle("progressUpdates")}
            />
            <Label htmlFor="progressUpdates">
              Receive progress update notifications
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Updates</CardTitle>
          <CardDescription>
            Get notified about team changes, new OKRs, and other team-related
            activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="teamUpdates"
              checked={formData.teamUpdates}
              onCheckedChange={() => handleToggle("teamUpdates")}
            />
            <Label htmlFor="teamUpdates">
              Receive team update notifications
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
