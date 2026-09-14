# Monitoring Setup — Uptime & PM2 Health Check

This guide walks through setting up automated uptime monitoring and PM2 process health checks on your VPS.

## Overview

The monitoring system consists of:

1. **PM2 Configuration** (`ecosystem.config.js`) — process restart limits and log rotation
2. **Uptime Check Script** (`scripts/uptime-check.mjs`) — monitors site health and PM2 status
3. **Cron Job** — runs the uptime check every 5 minutes
4. **Telegram/Discord Webhook** — sends notifications when site goes down or recovers
5. **Log Rotation** (`pm2-logrotate`) — prevents disk space issues

## Prerequisites

- Node.js (v18+) installed on your VPS
- PM2 installed globally: `npm install -g pm2`
- Your `ai-interface` application deployed and running via PM2
- A Telegram bot or Discord webhook for notifications

## Step 1: Create Telegram Bot (or Discord Webhook)

### Option A: Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the prompts
3. Name your bot (e.g., "ai-interface-monitor")
4. Copy the **Bot Token** (looks like `123456789:ABCDEFGHIJKLmnopqrstuvwxyz`)
5. Get your **Chat ID**:
   - Create or find a group/channel for alerts
   - Send a test message to `@BotFather` with your chat identifier
   - Or use `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` to find your chat ID

### Option B: Discord Webhook

1. Open your Discord server and go to Settings → Webhooks
2. Create a new webhook in your alerts channel
3. Copy the **Webhook URL**

## Step 2: Set Environment Variables on VPS

Create or edit `.env` file in your application root:

```bash
# SSH into your VPS
ssh user@your-vps-ip
cd /path/to/ai-interface

# Edit .env (do NOT commit this to Git)
nano .env
```

Add these environment variables:

```
# Telegram Webhook URL (use your bot token and chat ID)
TELEGRAM_WEBHOOK_URL=https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage?chat_id=<YOUR_CHAT_ID>

# (or for Discord, use your webhook URL)
# TELEGRAM_WEBHOOK_URL=https://discord.com/api/webhooks/<WEBHOOK_ID>/<WEBHOOK_TOKEN>

# Site to monitor
UPTIME_CHECK_URL=http://localhost:3000

# PM2 process name (must match your ecosystem.config.js)
PM2_PROCESS_NAME=ai-interface

# Consecutive failures before alerting (default: 2 = ~10 minutes with 5-min checks)
FAILURE_THRESHOLD=2
```

**Important:** Never commit `.env` to Git. Verify it's in your `.gitignore`:

```bash
grep "^\.env$" .gitignore
```

## Step 3: Deploy PM2 Configuration

```bash
# From your application root
pm2 reload ecosystem.config.js

# Verify process is running
pm2 list

# View logs (optional)
pm2 logs ai-interface
```

## Step 4: Install Log Rotation Module

Prevents PM2 logs from consuming all disk space:

```bash
pm2 install pm2-logrotate

# Verify it's installed
pm2 module list
```

## Step 5: Set Up Cron Job for Uptime Checks

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * cd /path/to/ai-interface && node scripts/uptime-check.mjs >> logs/uptime-check.log 2>&1

# Verify cron is set
crontab -l
```

**Note:** Replace `/path/to/ai-interface` with your actual app path. Use an absolute path.

## Step 6: Test the Setup

### Manual Test Alert

Trigger a test notification to verify your webhook is working:

```bash
# From your application root with .env loaded
cd /path/to/ai-interface

# Run the uptime check manually
node scripts/uptime-check.mjs

# Check logs
tail -f logs/uptime-check.log
```

You should see:

- A message like: `DOWN notification sent for http://localhost:3000`
- A Telegram/Discord message in your configured channel

If you get `no-webhook-configured` or `network-error`, double-check your `.env` variables.

### Simulate a Crash

To test the full alert flow:

```bash
# Stop the application
pm2 stop ai-interface

# Wait ~10 minutes (2 checks × 5 minutes) or run uptime-check manually twice
node scripts/uptime-check.mjs
node scripts/uptime-check.mjs

# You should receive a DOWN notification

# Restart the application
pm2 start ai-interface

# Wait ~5 minutes (one more check) or run manually
node scripts/uptime-check.mjs

# You should receive a RECOVERED notification

# Verify state is cleared
cat scripts/.uptime-state.json  # should show {consecutiveFailures: 0, wasDown: false}
```

## Monitoring State

The uptime check maintains a state file: `scripts/.uptime-state.json`

```json
{
  "consecutiveFailures": 0,
  "wasDown": false
}
```

- `consecutiveFailures`: increments on each failed check, resets to 0 on success
- `wasDown`: tracks whether we've already sent a DOWN notification (prevents spam)

This file is **not committed to Git** (it's in `.gitignore`).

## Troubleshooting

### Cron job not running

```bash
# Check cron logs
grep CRON /var/log/syslog

# Or check if cron service is running
systemctl status cron
```

### Webhook notifications not arriving

1. Verify `.env` variables are set correctly
2. Test manually: `node scripts/uptime-check.mjs`
3. Check error logs: `tail -f logs/uptime-check.log`
4. Verify your Telegram bot token/chat ID with:
   ```
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```

### PM2 process not starting

```bash
# Check PM2 logs
pm2 logs ai-interface

# Verify ecosystem.config.js syntax
node -c ecosystem.config.js

# Try manual start
pm2 start ecosystem.config.js
```

### State file issues

If uptime checks are stuck in DOWN state:

```bash
# Reset state manually
echo '{"consecutiveFailures": 0, "wasDown": false}' > scripts/.uptime-state.json

# Run check again
node scripts/uptime-check.mjs
```

## Acceptance Criteria Coverage

- **AC-1:** Site health checked every 5 min via HTTP → no notification while up
- **AC-2:** 2 consecutive failures (≈10 min) → DOWN notification sent
- **AC-3:** PM2 restart limits enforced via `max_restarts`, `exponential_backoff_restart_delay`, `min_uptime`
- **AC-4:** PM2 process status checked via `pm2 jlist` — catches silent crashes
- **AC-5:** Recovery notification sent once (no spam) when site comes back up
- **AC-6:** Single failure below threshold → no notification (spam prevention)
- **AC-7:** Log rotation via `pm2-logrotate`
- **AC-S1:** Bot token/webhook URL stored in `.env` (not in Git), never logged

## Notes

- The monitoring system is passive and read-only — it does not restart processes automatically
- If PM2 process reaches `max_restarts` limit, manual intervention is required: `pm2 restart ai-interface`
- Telegram API rate limits: occasional failures are logged, retried on next cron run
- For production, consider adding an uptime dashboard or additional alerting channels beyond Telegram
