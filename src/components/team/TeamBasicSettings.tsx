"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TeamBasicSettingsProps {
  team: {
    id: string;
    name: string;
    description: string | null;
  };
}

export function TeamBasicSettings({ team }: TeamBasicSettingsProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (formData.name.trim().length === 0) {
      setError("Team name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await updateTeamAction(team.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    });

    setIsSaving(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to update team");
    }
  };

  const hasChanges =
    formData.name !== team.name ||
    formData.description !== (team.description || "");

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Team Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter team name"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            The team name will be visible to all team members.
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Enter team description (optional)"
            rows={3}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            A brief description of the team's purpose and goals.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
