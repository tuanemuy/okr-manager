import { LogOut, Mail, User } from "lucide-react";
import Link from "next/link";
import { getSession, logout } from "@/actions/session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { context } from "@/context";
import {
  getUserEmailFromSession,
  getUserIdFromSession,
  getUserNameFromSession,
} from "@/lib/session";

export async function Navbar() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Get fresh user data from database to ensure we show the latest information
  const userId = getUserIdFromSession(session);
  const userResult = await context.userRepository.getById(userId);
  const currentUser = userResult.isOk() ? userResult.value : null;

  // Use fresh data if available, fallback to session data
  const displayName =
    currentUser?.displayName ?? getUserNameFromSession(session);
  const email = currentUser?.email ?? getUserEmailFromSession(session);

  return (
    <nav className="border-b bg-background shadow">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold">
              OKR Manager
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                ダッシュボード
              </Link>
              <Link
                href="/teams"
                className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                チーム
              </Link>
              <Link
                href="/invitations"
                className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                招待
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/invitations" className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    招待
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={logout}>
                    <button type="submit" className="flex items-center w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
