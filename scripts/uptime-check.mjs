import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

/**
 * uptime-check.mjs — Uptime monitoring and PM2 health check
 *
 * Core functions (exported for testing):
 * - isHealthy(httpStatus)
 * - evaluateFailureThreshold(consecutiveFailures, threshold)
 * - shouldNotifyRecovery(wasDown, isUpNow)
 * - checkPm2ProcessStatus(processName, pm2JlistFn)
 * - buildNotificationPayload(type, details)
 * - sendWebhookNotification(webhookUrl, payload, fetchFn)
 *
 * Main execution: runs when invoked directly (`node scripts/uptime-check.mjs`)
 * - Fetches site health
 * - Checks PM2 process status
 * - Manages consecutive failure counter in scripts/.uptime-state.json
 * - Sends webhook notifications (DOWN, RECOVERED)
 */

// ============================================================================
// Core Functions (exported)
// ============================================================================

/**
 * Determines if HTTP response status indicates a healthy site.
 * AC-1: 2xx status codes = healthy, all others = not healthy
 */
export function isHealthy(httpStatus) {
  return httpStatus >= 200 && httpStatus < 300;
}

/**
 * Evaluates if consecutive failures exceed threshold.
 * AC-2, AC-6: Returns true only when threshold is met or exceeded.
 * This prevents false positives from single failures.
 */
export function evaluateFailureThreshold(consecutiveFailures, threshold) {
  return consecutiveFailures >= threshold;
}

/**
 * Determines if a recovery notification should be sent.
 * AC-5: Only notify on DOWN→UP transition, not on UP→UP (spam prevention)
 */
export function shouldNotifyRecovery(wasDown, isUpNow) {
  return wasDown && isUpNow;
}

/**
 * Checks PM2 process status via `pm2 jlist` output.
 * AC-4: Distinguishes between "process not found" and "process offline/errored"
 * This is critical for detecting silent crashes where PM2 drops the process.
 *
 * Returns:
 * - {found: false} when process doesn't exist in PM2 list
 * - {found: true, online: true} when process is online
 * - {found: true, online: false} when process is errored/stopped
 */
export async function checkPm2ProcessStatus(processName, pm2JlistFn) {
  const processes = await pm2JlistFn();

  const process = processes.find((p) => p.name === processName);

  if (!process) {
    return { found: false };
  }

  const isOnline = process.status === "online";
  return {
    found: true,
    online: isOnline,
  };
}

/**
 * Builds notification payload for webhook delivery.
 * AC-S1, AC-S2: Message is human-readable, no internal details exposed.
 */
export function buildNotificationPayload(type, details) {
  if (type !== "down" && type !== "recovered") {
    throw new Error(`Invalid notification type: ${type}. Must be 'down' or 'recovered'.`);
  }

  const timestamp = new Date().toISOString();

  if (type === "down") {
    return {
      type: "down",
      message: `Site is down: ${details?.url || "unknown"}`,
      timestamp,
    };
  }

  // type === "recovered"
  return {
    type: "recovered",
    message: `Site recovered: ${details?.url || "unknown"}`,
    timestamp,
  };
}

/**
 * Sends notification via webhook (Telegram, Discord, or custom endpoint).
 * AC-S1: Handles auth errors gracefully without throwing.
 * AC-S1: Silent failures are prevented — always returns {sent, reason?}.
 *
 * Returns:
 * - {sent: true} on success
 * - {sent: false, reason: "no-webhook-configured"} if webhook URL is empty/undefined
 * - {sent: false, reason: "unauthorized"} on 401/403
 * - {sent: false, reason: "network-error"} on network/fetch errors
 * - {sent: false, reason: "server-error"} on other HTTP errors
 */
export async function sendWebhookNotification(webhookUrl, payload, fetchFn) {
  // Validate webhook URL is configured
  if (!webhookUrl || webhookUrl.trim() === "") {
    return { sent: false, reason: "no-webhook-configured" };
  }

  try {
    const response = await fetchFn(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { sent: false, reason: "unauthorized" };
      }
      return { sent: false, reason: "server-error" };
    }

    return { sent: true };
  } catch (error) {
    // Network error, timeout, or fetch failure
    return { sent: false, reason: "network-error" };
  }
}

// ============================================================================
// Main Execution (only when run directly)
// ============================================================================

/**
 * Runs uptime check and sends notifications if needed.
 * Called only when script is executed directly: `node scripts/uptime-check.mjs`
 */
async function main() {
  const checkUrl = process.env.UPTIME_CHECK_URL || "http://localhost:3000";
  const processName = process.env.PM2_PROCESS_NAME || "ai-interface";
  const failureThreshold = parseInt(process.env.FAILURE_THRESHOLD || "2", 10);

  // Telegram webhook (expects both token and chat ID in one webhook URL)
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

  // State file to track consecutive failures
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const stateFilePath = path.join(scriptDir, ".uptime-state.json");

  // Load previous state
  let state = { consecutiveFailures: 0, wasDown: false };
  try {
    if (fs.existsSync(stateFilePath)) {
      const content = fs.readFileSync(stateFilePath, "utf-8");
      state = JSON.parse(content);
    }
  } catch (error) {
    console.error(`Failed to read state file: ${error.message}`);
  }

  // Step 1: Check site health
  let isUpNow = false;
  try {
    const response = await fetch(checkUrl, { signal: AbortSignal.timeout(10000) });
    isUpNow = isHealthy(response.status);
  } catch (error) {
    isUpNow = false;
  }

  // Step 2: Check PM2 process status
  let pm2ProcessOnline = true; // assume online unless proven otherwise
  try {
    const pm2JlistFn = async () => {
      const output = execSync("pm2 jlist", { encoding: "utf-8" });
      return JSON.parse(output);
    };

    const pm2Status = await checkPm2ProcessStatus(processName, pm2JlistFn);

    if (!pm2Status.found) {
      pm2ProcessOnline = false;
    } else if (pm2Status.found && !pm2Status.online) {
      pm2ProcessOnline = false;
    }
  } catch (error) {
    // If pm2 command fails, assume process is offline (pessimistic approach)
    console.error(`PM2 check failed: ${error.message}`);
    pm2ProcessOnline = false;
  }

  // Combined health: site must be up AND PM2 must be online
  const isHealthyNow = isUpNow && pm2ProcessOnline;

  // Step 3: Update failure counter
  if (!isHealthyNow) {
    state.consecutiveFailures += 1;
  } else {
    state.consecutiveFailures = 0;
  }

  // Step 4: Determine if notification is needed
  const shouldNotifyDown =
    evaluateFailureThreshold(state.consecutiveFailures, failureThreshold) &&
    state.wasDown === false;

  const shouldNotifyRecovered = shouldNotifyRecovery(state.wasDown, isHealthyNow);

  // Step 5: Send notifications
  if (shouldNotifyDown) {
    const payload = buildNotificationPayload("down", { url: checkUrl });
    const result = await sendWebhookNotification(webhookUrl, payload, fetch);

    if (result.sent) {
      state.wasDown = true;
      console.log(`DOWN notification sent for ${checkUrl}`);
    } else {
      console.warn(`Failed to send DOWN notification: ${result.reason}`);
    }
  }

  if (shouldNotifyRecovered) {
    const payload = buildNotificationPayload("recovered", { url: checkUrl });
    const result = await sendWebhookNotification(webhookUrl, payload, fetch);

    if (result.sent) {
      state.wasDown = false;
      console.log(`RECOVERED notification sent for ${checkUrl}`);
    } else {
      console.warn(`Failed to send RECOVERED notification: ${result.reason}`);
    }
  }

  // Step 6: Persist state
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`Failed to write state file: ${error.message}`);
  }
}

// ============================================================================
// Entry point: only run main() if this script is executed directly
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`Fatal error in uptime check: ${error.message}`);
    process.exit(1);
  });
}
