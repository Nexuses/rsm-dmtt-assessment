import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isAuthenticatedMiddlewareRequest,
  isSubmissionsPasswordConfigured,
} from "@/lib/submissions-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/submissions")) {
    return NextResponse.next();
  }

  if (pathname === "/api/submissions/login" || pathname === "/api/submissions/logout") {
    return NextResponse.next();
  }

  if (!isSubmissionsPasswordConfigured()) {
    return NextResponse.json(
      { message: "SUBMISSIONS_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (!isAuthenticatedMiddlewareRequest(req)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/submissions", "/api/submissions/:path*"],
};
