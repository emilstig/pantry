import { Resend } from "resend";
import { PantryItem } from "../types/pantry";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

export interface ReminderEmailData {
  items: PantryItem[];
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

    const { data, error } = await resend.emails.send({
      from,
      to: [recipientEmail],
      subject: `Pantry Reminder: ${items.length} items need attention`,
      html: generateReminderEmailHTML(items),
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

function generateReminderEmailHTML(items: PantryItem[]): string {
  const today = new Date();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return "#dc2626"; // Red for expired
    if (days <= 7) return "#dc2626"; // Red for urgent
    if (days <= 30) return "#d97706"; // Orange for warning
    return "#16a34a"; // Green for good
  };

  const getStatusText = (days: number) => {
    if (days < 0) return "EXPIRED";
    if (days <= 7) return "URGENT";
    if (days <= 30) return "SOON";
    return "GOOD";
  };

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
        <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 18px;">Items to Check:</h2>
        
        ${items
          .map(item => {
            const days = item.expiry ? getDaysUntilExpiry(item.expiry) : 0;
            const statusColor = getStatusColor(days);
            const statusText = getStatusText(days);

            return `
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 12px; background: #fafafa;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3 style="margin: 0; color: #1f2937; font-size: 16px;">${item.name}</h3>
                <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                  ${statusText}
                </span>
              </div>
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
                Quantity: ${item.quantity} × ${item.unitQuantity}${item.unitUnit}
              </div>
              ${
                item.expiry
                  ? `
                <div style="color: #6b7280; font-size: 14px;">
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
                  : ""
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
          })
          .join("")}
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 20px; text-align: center;">
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          💡 <strong>Tip:</strong> Check your pantry app to mark items as replaced or update their status.
        </p>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
          This reminder was sent automatically by your Pantry Manager.
        </p>
      </div>
    </body>
    </html>
  `;
}
