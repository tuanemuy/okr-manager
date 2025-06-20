import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { context } from "@/context";

interface AuthenticatedRequest extends NextRequest {
  auth?: {
    user?: {
      id: string;
      email: string;
      name: string;
    };
  } | null;
}

const authHandlers = context.authService.getHandlers();

export default authHandlers.auth(async (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/auth/login", "/auth/signup", "/api/auth"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!(req as AuthenticatedRequest).auth && !isPublicPath) {
    const loginUrl = new URL("/auth/login", context.publicUrl);
    return NextResponse.redirect(loginUrl);
  }

  if ((req as AuthenticatedRequest).auth && pathname.startsWith("/auth/")) {
    const dashboardUrl = new URL("/dashboard", context.publicUrl);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
