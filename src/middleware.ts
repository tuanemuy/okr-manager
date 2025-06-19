import { context } from "@/context";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface AuthenticatedRequest extends NextRequest {
  auth?: {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  } | null;
}

export default (
  context.authService.getHandlers() as {
    auth: (handler: (req: AuthenticatedRequest) => unknown) => unknown;
  }
).auth((req: AuthenticatedRequest) => {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/auth/login", "/auth/signup", "/api/auth"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublicPath) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && pathname.startsWith("/auth/")) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
