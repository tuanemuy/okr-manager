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
          <CardTitle>チーム招待</CardTitle>
          <CardDescription>
            チームに招待された時や招待状況が変更された時に通知を受け取ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="invitations"
              checked={formData.invitations}
              onCheckedChange={() => handleToggle("invitations")}
            />
            <Label htmlFor="invitations">招待通知を受け取る</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>レビューリマインダー</CardTitle>
          <CardDescription>
            OKRをレビューする時期やレビューの期限が近づいた時にお知らせします。
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
              レビューリマインダー通知を受け取る
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>進捗更新</CardTitle>
          <CardDescription>
            チームメンバーがOKRの進捗やキーリザルトを更新した時に通知を受け取ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="progressUpdates"
              checked={formData.progressUpdates}
              onCheckedChange={() => handleToggle("progressUpdates")}
            />
            <Label htmlFor="progressUpdates">進捗更新通知を受け取る</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>チーム更新</CardTitle>
          <CardDescription>
            チームの変更、新しいOKR、その他チームに関する活動について通知を受け取ります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="teamUpdates"
              checked={formData.teamUpdates}
              onCheckedChange={() => handleToggle("teamUpdates")}
            />
            <Label htmlFor="teamUpdates">チーム更新通知を受け取る</Label>
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
          {isSaving ? "保存中..." : "設定を保存"}
        </Button>
      </div>
    </div>
  );
}
