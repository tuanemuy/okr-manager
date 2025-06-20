"use client";

import { deleteTeamAction } from "@/actions/team";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TeamDangerZoneProps {
  team: {
    id: string;
    name: string;
    memberCount: number;
  };
}

export function TeamDangerZone({ team }: TeamDangerZoneProps) {
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmationText !== team.name) {
      setError("Team name doesn't match");
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deleteTeamAction(team.id);

    setIsDeleting(false);

    if (result.success) {
      router.push("/teams");
    } else {
      setError(result.error || "Failed to delete team");
    }
  };

  const canDelete = team.memberCount <= 1; // Only allow deletion if team has 1 or fewer members (just the admin)
  const isConfirmationValid = confirmationText === team.name;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 mb-2">Delete Team</h4>
            <p className="text-sm text-red-700 mb-4">
              Once you delete a team, there is no going back. This action cannot
              be undone. All OKRs, reviews, and team data will be permanently
              deleted.
            </p>

            {!canDelete && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Cannot delete team:</strong> This team has{" "}
                  {team.memberCount} members. You must remove all other members
                  before deleting the team.
                </p>
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={!canDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This action cannot be undone. This will permanently delete
                      the
                      <strong className="font-medium"> {team.name} </strong>
                      team and all associated data including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All team and personal OKRs</li>
                      <li>All reviews and progress history</li>
                      <li>All team member associations</li>
                      <li>All team settings and configurations</li>
                    </ul>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmation"
                        className="text-sm font-medium"
                      >
                        Please type{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          {team.name}
                        </code>{" "}
                        to confirm:
                      </Label>
                      <Input
                        id="confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Type team name to confirm"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmationText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={!isConfirmationValid || isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Team"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
