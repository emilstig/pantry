import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import { sendReminderEmail } from "../../services/emailService";
import { getExpiryStatus } from "../../utils/expiryUtils";

// Default settings for reminder check
const DEFAULT_SETTINGS = {
  expiringSoonDays: 90,
  replaceDays: 30,
};

export async function POST(_request: NextRequest) {
  try {
    console.log("Starting weekly reminder check...");

    // Get all items that are not replaced
    const { data: items, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("is_replaced", false)
      .not("expiry", "is", null);

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

    // Filter items that need replacement (within replace days)
    const itemsNeedingReplacement = items.filter(item => {
      if (!item.expiry) return false;

      const status = getExpiryStatus(item.expiry, DEFAULT_SETTINGS);
      return status === "replace" || status === "expired";
    });

    if (itemsNeedingReplacement.length === 0) {
      console.log("No items need replacement reminders");
      return NextResponse.json({ message: "No items need replacement" });
    }

    // Get recipient email from environment or request
    const recipientEmail =
      process.env.REMINDER_EMAIL || "your-email@example.com";

    if (!recipientEmail || recipientEmail === "your-email@example.com") {
      console.error("REMINDER_EMAIL environment variable not set");
      return NextResponse.json(
        { error: "Email not configured" },
        { status: 500 }
      );
    }

    // Send reminder email
    const emailResult = await sendReminderEmail({
      items: itemsNeedingReplacement,
      recipientEmail,
    });

    if (!emailResult.success) {
      console.error("Failed to send reminder email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Update reminder count for all items that were reminded
    const updatePromises = itemsNeedingReplacement.map(item =>
      supabase
        .from("pantry_items")
        .update({
          reminder_count: item.reminder_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
    );

    const updateResults = await Promise.all(updatePromises);
    const updateErrors = updateResults.filter(result => result.error);

    if (updateErrors.length > 0) {
      console.error("Some reminder count updates failed:", updateErrors);
    }

    console.log(`Reminder sent for ${itemsNeedingReplacement.length} items`);

    return NextResponse.json({
      success: true,
      itemsReminded: itemsNeedingReplacement.length,
      message: "Reminder email sent successfully",
    });
  } catch (error) {
    console.error("Error in reminder check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: "Reminder endpoint is working",
    timestamp: new Date().toISOString(),
  });
}
