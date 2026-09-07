import { Resend } from "resend";
import { PantryItem } from "../types/pantry";
import { getDaysUntilExpiry } from "../utils/expiryUtils";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

/** Accepts app-shaped items or raw Supabase rows (snake_case). */
type ReminderItemInput = PantryItem | Record<string, unknown>;

function normalizeReminderItem(item: ReminderItemInput): PantryItem {
  const row = item as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    quantity: Number(row.quantity ?? 0),
    unitQuantity: Number(row.unitQuantity ?? row.unit_quantity ?? 0),
    unitUnit: (row.unitUnit ?? row.unit_unit ?? "g") as PantryItem["unitUnit"],
    expiry: (row.expiry as string | undefined) ?? undefined,
    notes: (row.notes as string | undefined) ?? undefined,
    reminderCount: Number(row.reminderCount ?? row.reminder_count ?? 0),
    isReplaced: Boolean(row.isReplaced ?? row.is_replaced ?? false),
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? ""),
  };
}

export interface ReminderEmailData {
  items: ReminderItemInput[];
  recipientEmail: string;
}

export async function sendReminderEmail({
  items,
  recipientEmail,
}: ReminderEmailData) {
  try {
    const resend = getResendClient();
    const from =
      process.env.REMINDER_FROM_EMAIL ||
      "Pantry Manager <onboarding@resend.dev>";
    const normalizedItems = items.map(normalizeReminderItem);

    const { data, error } = await resend.emails.send({
      from,
      to: [recipientEmail],
      subject: `Pantry Reminder: ${normalizedItems.length} items need attention`,
      html: generateReminderEmailHTML(normalizedItems),
    });

    if (error) {
      console.error("Error sending reminder email:", error);
      return { success: false, error };
    }

    console.log("Reminder email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return { success: false, error };
  }
}

function sortByExpiryAsc(a: PantryItem, b: PantryItem) {
  if (!a.expiry && !b.expiry) return 0;
  if (!a.expiry) return 1;
  if (!b.expiry) return -1;
  return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
}

function renderItemCard(item: PantryItem): string {
  const days = item.expiry ? getDaysUntilExpiry(item.expiry) : null;
  const markedAsUsed = !item.isReplaced;
  const expired = days !== null && days < 0;

  // USED wins when both used and expired; EXPIRED only when not used.
  let statusColor = "#ea580c";
  let statusText = "USED";

  if (markedAsUsed) {
    statusColor = "#ea580c";
    statusText = "USED";
  } else if (expired) {
    statusColor = "#dc2626";
    statusText = "EXPIRED";
  } else if (days !== null && days <= 7) {
    statusColor = "#dc2626";
    statusText = "URGENT";
  } else if (days !== null && days <= 30) {
    statusColor = "#d97706";
    statusText = "SOON";
  } else {
    statusColor = "#ea580c";
    statusText = "USED";
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("sv-SE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const expiryColor =
    days !== null && days < 0
      ? "#dc2626"
      : days !== null
        ? "#16a34a"
        : "#6b7280";

  return `
    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 12px; background: #fafafa;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
        <tr>
          <td align="left" valign="top" style="padding-right: 12px;">
            <h3 style="margin: 0; color: #1f2937; font-size: 16px;">${item.name}</h3>
          </td>
          <td align="right" valign="top" width="1%" style="white-space: nowrap;">
            <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
              ${statusText}
            </span>
          </td>
        </tr>
      </table>
      <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
        Quantity: ${item.quantity} × ${item.unitQuantity}${item.unitUnit}
      </div>
      ${
        item.expiry && days !== null
          ? `
        <div style="color: ${expiryColor}; font-size: 14px;">
          Expires: ${formatDate(item.expiry)}
          ${
            days < 0
              ? `(${Math.abs(days)} days overdue)`
              : days === 0
                ? "(Today)"
                : `(${days} days left)`
          }
        </div>
      `
          : `<div style="color: #6b7280; font-size: 14px;">No expiry date</div>`
      }
      ${
        item.notes
          ? `
        <div style="color: #6b7280; font-size: 14px; font-style: italic; margin-top: 4px;">
          Note: ${item.notes}
        </div>
      `
          : ""
      }
      ${
        item.reminderCount > 0
          ? `
        <div style="color: #d97706; font-size: 12px; margin-top: 4px;">
          📧 Reminded ${item.reminderCount} time${item.reminderCount > 1 ? "s" : ""}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderSection(title: string, items: PantryItem[]) {
  if (items.length === 0) return "";

  return `
    <div style="margin-bottom: 28px;">
      <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">${title}</h2>
      ${items.map(renderItemCard).join("")}
    </div>
  `;
}

function generateReminderEmailHTML(items: PantryItem[]): string {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");

  // Same set as app "Replace now", one section with USED/EXPIRED labels.
  const replaceNowItems = [...items].sort(sortByExpiryAsc);

  const ctaBlock = appUrl
    ? `
      <div style="text-align: center; margin: 24px 0 8px 0;">
        <a href="${appUrl}"
           style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: bold;">
          Open Pantry Manager
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pantry Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0 0 10px 0; text-align: center;">🛒 Pantry Reminder</h1>
        <p style="color: #64748b; margin: 0; text-align: center; font-size: 16px;">
          You have <strong>${items.length}</strong> items that need your attention
        </p>
      </div>

      <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ${renderSection("Replace now", replaceNowItems)}
      </div>

      ${ctaBlock}

      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 20px; text-align: center;">
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          💡 <strong>Tip:</strong> Open the app to mark items as replaced or update their status.
        </p>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
          This reminder was sent automatically by your Pantry Manager.
        </p>
      </div>
    </body>
    </html>
  `;
}
