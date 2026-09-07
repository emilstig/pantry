import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel Cron sends GET with Authorization: Bearer <CRON_SECRET>
 * when CRON_SECRET is set in the project env.
 */
export function assertCronAuthorized(
  request: NextRequest
): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  // Allow unauthenticated access in local development only
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
