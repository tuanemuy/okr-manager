import { Suspense } from "react";
import { ProfileForms } from "@/components/profile/ProfileForms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { context } from "@/context";
import { userIdSchema } from "@/core/domain/user/types";

function ProfileSkeleton() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Label>Display Name</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Current Password</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Label>New Password</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Label>Confirm New Password</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and usage information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Account Created</Label>
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid gap-2">
            <Label>Last Updated</Label>
            <Skeleton className="h-5 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ProfileContent() {
  const sessionResult = await context.sessionManager.get();

  if (sessionResult.isErr() || !sessionResult.value) {
    return <div>Not authenticated</div>;
  }

  const session = sessionResult.value;

  const userId = userIdSchema.parse(session.user.id);
  const userResult = await context.userRepository.getById(userId);
  if (userResult.isErr() || !userResult.value) {
    return <div>User not found</div>;
  }

  const user = userResult.value;

  return (
    <div className="grid gap-6">
      <ProfileForms user={user} />

      <Separator />

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View your account details and usage information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Account Created</Label>
            <p className="text-sm text-muted-foreground">
              {user.createdAt.toLocaleDateString()}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Last Updated</Label>
            <p className="text-sm text-muted-foreground">
              {user.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
