# Monthly Quota Reset for Basic Users

This documentation explains how YouScribe handles automatic monthly quota resets for Basic plan users.

## Overview

Basic plan users have a quota of 100 video summaries per subscription period (30 days). This quota is reset automatically when their subscription period ends.

## Implementation Details

The quota reset system consists of two main components:

1. **Subscription Period Tracking**: When a user purchases the Basic plan, we store their period end date (30 days from purchase).

2. **Automatic Quota Reset**: A scheduled job checks for users whose period has ended and resets their quota.

## How It Works

### Purchase & Period Tracking

When a user purchases the Basic plan through Stripe:
- Their `usedQuota` is set to 0
- Their `stripeCurrentPeriodEnd` is set to 30 days from purchase date

### Quota Reset Process

The system automatically checks for users whose subscription period has ended:
1. Identifies Basic users where `stripeCurrentPeriodEnd` < current date
2. Resets their `usedQuota` to 0
3. Sets a new `stripeCurrentPeriodEnd` date 30 days in the future

## Configuration

### Environment Variables

Add the following environment variable to your `.env` file:

```
CRON_SECRET_KEY=your_secure_random_string_here
```

This key is used to authenticate the cron job requests.

### Setting Up the Cron Job

The quota reset cron job should run daily to check for and reset quotas of users whose period has ended.

#### Using a Cron Job Service (Recommended)

You can use a service like [Upstash](https://upstash.com/), [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs), or [GitHub Actions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) to schedule the daily check.

Example configuration for Vercel:

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-quotas?api_key=your_secret_key_here",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This will run the reset job daily at midnight.

#### Manual Cron Job (Linux/Unix)

If you're hosting on a Linux/Unix server, you can set up a traditional cron job:

```bash
# Edit crontab
crontab -e

# Add this line (replace YOUR_DOMAIN and YOUR_SECRET_KEY)
0 0 * * * curl -X POST "https://YOUR_DOMAIN/api/cron/reset-quotas?api_key=YOUR_SECRET_KEY" > /dev/null 2>&1
```

## Verification

You can manually trigger the endpoint to test it:

```bash
curl -X POST "https://YOUR_DOMAIN/api/cron/reset-quotas?api_key=YOUR_SECRET_KEY"
```

The response will show which users had their quotas reset:
```json
{
  "success": true,
  "message": "Quota reset completed for users with ended periods",
  "usersUpdated": 3,
  "timestamp": "2023-06-15T12:00:00.000Z"
}
```

## Monitoring

It's recommended to set up monitoring to ensure the quota reset happens successfully. You can:

1. Check the logs in your hosting platform
2. Implement email notifications for successful/failed resets
3. Add metrics tracking for the number of users whose quotas were reset

## Security Considerations

- Keep the `CRON_SECRET_KEY` secret and use a strong random string
- Consider using HTTPS-only access for your API endpoints
- Limit access to the endpoint by IP address if possible

## Integration with Stripe

Note that when users upgrade their plan through Stripe, their quota is already reset as part of the purchase process, as implemented in the Stripe webhook handler. 