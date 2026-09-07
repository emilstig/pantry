import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "../../lib/cronAuth";
import { supabase } from "../../lib/supabase";
import { sendReminderEmail } from "../../services/emailService";
import { getDaysUntilExpiry } from "../../utils/expiryUtils";

async function runReminderCheck() {
  console.log("Starting weekly reminder check...");

  // Same set as "Replace now" in the app: marked as used, or past expiry.
  const { data: items, error } = await supabase
    .from("pantry_items")
    .select("*");

  if (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }

  if (!items || items.length === 0) {
    console.log("No items found for reminder check");
    return NextResponse.json({ message: "No items to check" });
  }

  const itemsNeedingAttention = items.filter(item => {
    const markedAsUsed = item.is_replaced === false;
    const expired = !!item.expiry && getDaysUntilExpiry(item.expiry) < 0;
    return markedAsUsed || expired;
  });

  if (itemsNeedingAttention.length === 0) {
    console.log("No items need replacement reminders");
    return NextResponse.json({ message: "No items need replacement" });
  }

  const recipientEmail = process.env.REMINDER_EMAIL;

  if (!recipientEmail) {
    console.error("REMINDER_EMAIL environment variable not set");
    return NextResponse.json(
      { error: "Email not configured" },
      { status: 500 }
    );
  }

  const emailResult = await sendReminderEmail({
    items: itemsNeedingAttention,
    recipientEmail,
  });

  if (!emailResult.success) {
    console.error("Failed to send reminder email:", emailResult.error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }

  const updatePromises = itemsNeedingAttention.map(item =>
    supabase
      .from("pantry_items")
      .update({
        reminder_count: (item.reminder_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
  );

  const updateResults = await Promise.all(updatePromises);
  const updateErrors = updateResults.filter(result => result.error);

  if (updateErrors.length > 0) {
    console.error("Some reminder count updates failed:", updateErrors);
  }

  console.log(`Reminder sent for ${itemsNeedingAttention.length} items`);

  return NextResponse.json({
    success: true,
    itemsReminded: itemsNeedingAttention.length,
    message: "Reminder email sent successfully",
  });
}

// Vercel Cron invokes GET
export async function GET(request: NextRequest) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    return await runReminderCheck();
  } catch (error) {
    console.error("Error in reminder check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  try {
    return await runReminderCheck();
  } catch (error) {
    console.error("Error in reminder check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
