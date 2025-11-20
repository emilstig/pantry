# Weekly Reminder Setup Guide

## Overview
This guide explains how to set up weekly email reminders for your pantry items using Resend and a cron job.

## Prerequisites
1. Resend account and API key
2. Supabase project with updated schema
3. Environment variables configured

## Environment Variables
Add these to your `.env.local` file:

```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key

# Email Configuration
REMINDER_EMAIL=your-email@example.com

# Supabase Configuration (already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Database Schema Update
Run the updated SQL schema in your Supabase SQL Editor to add the new fields:
- `reminder_count` (INTEGER, DEFAULT 0)
- `is_replaced` (BOOLEAN, DEFAULT FALSE)

## Cron Job Setup

### Option 1: Vercel Cron Jobs (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to Functions → Cron Jobs
3. Create a new cron job with:
   - **Name**: `pantry-reminder`
   - **Schedule**: `0 9 * * 1` (Every Monday at 9 AM)
   - **Endpoint**: `/api/reminder`

### Option 2: External Cron Service
Use a service like:
- **cron-job.org**: Free cron service
- **EasyCron**: More advanced features
- **GitHub Actions**: If using GitHub

#### Example GitHub Actions Workflow:
```yaml
name: Weekly Pantry Reminder
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  send-reminder:
    runs-on: ubuntu-latest
    steps:
      - name: Send Reminder
        run: |
          curl -X POST https://your-domain.com/api/reminder
```

### Option 3: Local Cron (Development)
Add to your crontab:
```bash
# Edit crontab
crontab -e

# Add this line (replace with your domain)
0 9 * * 1 curl -X POST https://your-domain.com/api/reminder
```

## Testing the Reminder

### Manual Test
```bash
curl -X POST https://your-domain.com/api/reminder
```

### Expected Response
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
1. **Email not sending**: Check RESEND_API_KEY and REMINDER_EMAIL
2. **No items found**: Ensure items have expiry dates and aren't marked as replaced
3. **Database errors**: Verify Supabase connection and schema

### Logs
Check your deployment logs for:
- "Starting weekly reminder check..."
- "Reminder sent for X items"
- Any error messages

## Customization

### Change Reminder Frequency
- **Daily**: `0 9 * * *` (Every day at 9 AM)
- **Weekly**: `0 9 * * 1` (Every Monday at 9 AM)
- **Bi-weekly**: `0 9 1,15 * *` (1st and 15th of each month)

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
- The reminder endpoint is public - consider adding authentication
- Use environment variables for sensitive data
- Monitor your Resend usage to avoid rate limits

## Monitoring
- Set up alerts for failed reminder sends
- Monitor your Resend dashboard for delivery status
- Check Supabase logs for database issues
