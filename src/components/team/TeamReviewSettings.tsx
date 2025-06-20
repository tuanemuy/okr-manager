"use client";

import { updateTeamReviewFrequencyAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TeamReviewSettingsProps {
  team: {
    id: string;
    reviewFrequency: "weekly" | "biweekly" | "monthly";
  };
}

export function TeamReviewSettings({ team }: TeamReviewSettingsProps) {
  const router = useRouter();
  const [frequency, setFrequency] = useState(team.reviewFrequency);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const result = await updateTeamReviewFrequencyAction(team.id, frequency);

    setIsSaving(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to update review frequency");
    }
  };

  const hasChanges = frequency !== team.reviewFrequency;

  const getFrequencyDescription = (freq: string) => {
    switch (freq) {
      case "weekly":
        return "Team members will be reminded to review their OKRs every week.";
      case "biweekly":
        return "Team members will be reminded to review their OKRs every two weeks.";
      case "monthly":
        return "Team members will be reminded to review their OKRs every month.";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="frequency">Review Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(value) => setFrequency(value as typeof frequency)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select review frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Weekly
                </div>
              </SelectItem>
              <SelectItem value="biweekly">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Bi-weekly (Every 2 weeks)
                </div>
              </SelectItem>
              <SelectItem value="monthly">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Monthly
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            {getFrequencyDescription(frequency)}
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            About Review Frequency
          </h4>
          <p className="text-sm text-blue-700">
            The review frequency determines how often team members receive
            reminders to update their OKR progress. Regular reviews help
            maintain momentum and ensure objectives stay on track.
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
