import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "../../lib/cronAuth";
import { supabase } from "../../lib/supabase";

/**
 * Lightweight DB ping so free-tier Supabase does not pause from inactivity.
 * Invoked daily by Vercel Cron (see vercel.json).
 */
async function pingDatabase() {
  const { error, count } = await supabase
    .from("pantry_items")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Keepalive DB ping failed:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    itemCount: count ?? 0,
  });
}

export async function GET(request: NextRequest) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    return await pingDatabase();
  } catch (error) {
    console.error("Keepalive error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
