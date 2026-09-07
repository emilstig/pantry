# Cron Jobs Setup Guide

## Overview
Vercel Cron drives two endpoints (see `vercel.json`):

| Path | Schedule | Purpose |
| --- | --- | --- |
| `/api/keepalive` | `0 4 * * *` (daily 04:00 UTC) | Light Supabase query so free-tier projects do not pause |
| `/api/reminder` | `0 7 * * 1` (Mondays ~09 Swedish time) | Weekly expiry emails via Resend |

Both routes require `Authorization: Bearer <CRON_SECRET>` in production. Vercel Cron sends this header automatically when `CRON_SECRET` is set in the project env.

## Prerequisites
1. Resend account and API key (for reminders)
2. Supabase project with updated schema
3. Environment variables configured on Vercel

## Environment Variables
Add these in Vercel → Settings → Environment Variables (and locally in `.env.local`):

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key

# Email Configuration
REMINDER_EMAIL=your-email@example.com
REMINDER_FROM_EMAIL=Pantry Manager <onboarding@resend.dev>

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Cron auth (required in production)
CRON_SECRET=generate_with_openssl_rand_hex_32
```

## Database Schema Update
Run the updated SQL schema in your Supabase SQL Editor to add the new fields:
- `reminder_count` (INTEGER, DEFAULT 0)
- `is_replaced` (BOOLEAN, DEFAULT FALSE)

## Cron Job Setup

Cron schedules are declared in `vercel.json` and applied on deploy. On the Vercel Hobby plan you can have up to two daily jobs, which matches this project.

### Manual test
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/keepalive
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/reminder
```

### Expected keepalive response
```json
{
  "ok": true,
  "timestamp": "2026-09-07T04:00:00.000Z",
  "itemCount": 12
}
```

### Expected reminder response
```json
{
  "success": true,
  "itemsReminded": 3,
  "message": "Reminder email sent successfully"
}
```

## Email Template Features
- **Color-coded status**: Red for urgent, yellow for warning, green for good
- **Item details**: Name, quantity, expiry date, days left
- **Reminder count**: Shows how many times each item has been reminded
- **Professional design**: Clean, responsive HTML email

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Missing or wrong `CRON_SECRET`
2. **Email not sending**: Check `RESEND_API_KEY`, `REMINDER_EMAIL`, and verified `REMINDER_FROM_EMAIL`
3. **No items found**: Ensure items have expiry dates and aren't marked as replaced
4. **Database errors**: Verify Supabase connection and schema
5. **Supabase paused**: Confirm `/api/keepalive` runs daily in Vercel Cron Jobs

### Logs
Check your deployment logs for:
- Keepalive success / DB ping failures
- "Starting weekly reminder check..."
- "Reminder sent for X items"

## Customization

### Change Reminder Frequency
Edit `vercel.json` schedules (Hobby: once per day max per job):
- **Daily**: `0 9 * * *`
- **Weekly**: `0 7 * * 1` (~09 Swedish time: 09 winter / 08 summer)
- **Bi-weekly**: `0 9 1,15 * *`

### Modify Warning Thresholds
Update the `DEFAULT_SETTINGS` in `/api/reminder/route.ts`:
```typescript
const DEFAULT_SETTINGS = {
  expiringSoonDays: 90,  // 3 months
  replaceDays: 30,       // 1 month
};
```

### Email Customization
Edit the email template in `/services/emailService.ts` to:
- Change colors and styling
- Add your branding
- Modify the content and layout

## Security Notes
- Cron endpoints require `CRON_SECRET` in production
- Use environment variables for sensitive data
- Monitor your Resend usage to avoid rate limits

## Monitoring
- Set up alerts for failed reminder sends
- Monitor your Resend dashboard for delivery status
- Check Supabase logs for database issues
