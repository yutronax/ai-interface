import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  evaluateFailureThreshold,
  shouldNotifyRecovery,
  isHealthy,
  buildNotificationPayload,
  checkPm2ProcessStatus,
  sendWebhookNotification,
} from "./uptime-check.mjs";

/**
 * ATDD Unit Tests for uptime-check.mjs
 *
 * Coverage:
 * - AC-1: Happy path (2xx response, no notification)
 * - AC-2: Threshold logic (consecutive failures)
 * - AC-4: PM2 process status detection (max_restarts reached)
 * - AC-5: Recovery notification
 * - AC-6: False-positive prevention (single failure below threshold)
 * - AC-S1: Secret/webhook security (401/403 handling)
 * - Davranış Sözleşmesi: Config missing, network errors, silent failure prevention
 */

describe("uptime-check.mjs — Unit Tests", () => {
  // ============================================================================
  // AC-1 [Critical]: Happy path — isHealthy() function
  // Given site ayaktayken, When HTTP status is 2xx, Then isHealthy returns true
  // ============================================================================
  describe("AC-1 [Critical]: isHealthy() — Happy path detection", () => {
    it("should return true for HTTP 200 (OK)", () => {
      expect(isHealthy(200)).toBe(true);
    });

    it("should return true for HTTP 201 (Created)", () => {
      expect(isHealthy(201)).toBe(true);
    });

    it("should return true for HTTP 202 (Accepted)", () => {
      expect(isHealthy(202)).toBe(true);
    });

    it("should return true for HTTP 204 (No Content)", () => {
      expect(isHealthy(204)).toBe(true);
    });

    it("should return true for all 2xx status codes (299 edge case)", () => {
      expect(isHealthy(299)).toBe(true);
    });

    it("should return false for HTTP 404 (Not Found)", () => {
      expect(isHealthy(404)).toBe(false);
    });

    it("should return false for HTTP 500 (Internal Server Error)", () => {
      expect(isHealthy(500)).toBe(false);
    });

    it("should return false for HTTP 503 (Service Unavailable)", () => {
      expect(isHealthy(503)).toBe(false);
    });

    it("should return false for HTTP 301 (Redirect — not 2xx)", () => {
      expect(isHealthy(301)).toBe(false);
    });

    it("should return false for HTTP 400 (Bad Request)", () => {
      expect(isHealthy(400)).toBe(false);
    });

    it("should return false for HTTP 301 redirect (not success)", () => {
      expect(isHealthy(301)).toBe(false);
    });
  });

  // ============================================================================
  // AC-2 [Critical]: Threshold logic — evaluateFailureThreshold() function
  // Given 2 ardışık kontrolde fail When eşik aşılır Then true döner
  // AC-6 [Medium]: False-positive prevention — single fail below threshold
  // ============================================================================
  describe("AC-2 & AC-6 [Critical/Medium]: evaluateFailureThreshold() — Consecutive failure counting", () => {
    it("should return false when failures=0, threshold=2 (no failures yet)", () => {
      expect(evaluateFailureThreshold(0, 2)).toBe(false);
    });

    it("should return false when failures=1, threshold=2 (below threshold)", () => {
      expect(evaluateFailureThreshold(1, 2)).toBe(false);
    });

    it("should return true when failures=2, threshold=2 (threshold exactly met)", () => {
      // Boundary test: at the threshold, notification should trigger
      expect(evaluateFailureThreshold(2, 2)).toBe(true);
    });

    it("should return true when failures=3, threshold=2 (above threshold)", () => {
      expect(evaluateFailureThreshold(3, 2)).toBe(true);
    });

    it("should return true when failures=5, threshold=2 (well above threshold)", () => {
      expect(evaluateFailureThreshold(5, 2)).toBe(true);
    });

    it("should return false when failures=0, threshold=3 (no failures)", () => {
      expect(evaluateFailureThreshold(0, 3)).toBe(false);
    });

    it("should return false when failures=1, threshold=3 (single failure, AC-6 spam prevention)", () => {
      // AC-6: Geçici tekil ağ kesintisinde bildirim gönderilmez
      expect(evaluateFailureThreshold(1, 3)).toBe(false);
    });

    it("should return false when failures=2, threshold=3 (still below threshold)", () => {
      expect(evaluateFailureThreshold(2, 3)).toBe(false);
    });

    it("should return true when failures=3, threshold=3 (at threshold)", () => {
      expect(evaluateFailureThreshold(3, 3)).toBe(true);
    });

    it("should handle threshold=1 edge case (immediate notification on first fail)", () => {
      expect(evaluateFailureThreshold(0, 1)).toBe(false);
      expect(evaluateFailureThreshold(1, 1)).toBe(true);
    });

    it("should handle large threshold values", () => {
      expect(evaluateFailureThreshold(9, 10)).toBe(false);
      expect(evaluateFailureThreshold(10, 10)).toBe(true);
      expect(evaluateFailureThreshold(11, 10)).toBe(true);
    });
  });

  // ============================================================================
  // AC-5 [High]: Recovery notification — shouldNotifyRecovery() function
  // Given site tekrar ayağa kalktığında When recovery happens Then "recovered" bildirimi gönderilir
  // ============================================================================
  describe("AC-5 [High]: shouldNotifyRecovery() — Recovery transition detection", () => {
    it("should return true when wasDown=true and isUpNow=true (site recovered)", () => {
      expect(shouldNotifyRecovery(true, true)).toBe(true);
    });

    it("should return false when wasDown=false and isUpNow=true (site was already up)", () => {
      // AC-5: Sürekli DOWN bildirimi tekrarlanmaz, zaten up'tı tekrar bildirim gitmemeli
      expect(shouldNotifyRecovery(false, true)).toBe(false);
    });

    it("should return false when wasDown=true and isUpNow=false (site still down)", () => {
      expect(shouldNotifyRecovery(true, false)).toBe(false);
    });

    it("should return false when wasDown=false and isUpNow=false (site still down, was already down)", () => {
      expect(shouldNotifyRecovery(false, false)).toBe(false);
    });

    it("should prevent notification spam by requiring previous DOWN state", () => {
      // Only notify recovery if we were in DOWN state
      const wasNotDown = false;
      const nowUp = true;
      expect(shouldNotifyRecovery(wasNotDown, nowUp)).toBe(false);
    });
  });

  // ============================================================================
  // AC-4 [High]: PM2 process status check — checkPm2ProcessStatus() function
  // Given PM2 process max_restarts limitine ulaşıp "errored/stopped" durumuna geçtiğinde
  // When bu durum oluşur Then sadece HTTP uptime-check'e güvenilmez
  // ============================================================================
  describe("AC-4 [High]: checkPm2ProcessStatus() — PM2 process monitoring", () => {
    it("should return {found:true, online:true} when process is online", async () => {
      const mockPm2Jlist = vi.fn().mockResolvedValue([
        {
          name: "ai-interface",
          status: "online",
          pm_id: 0,
        },
      ]);

      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: true, online: true });
      expect(mockPm2Jlist).toHaveBeenCalledOnce();
    });

    it("should return {found:true, online:false} when process status is 'errored'", async () => {
      const mockPm2Jlist = vi.fn().mockResolvedValue([
        {
          name: "ai-interface",
          status: "errored",
          pm_id: 0,
        },
      ]);

      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: true, online: false });
    });

    it("should return {found:true, online:false} when process status is 'stopped'", async () => {
      const mockPm2Jlist = vi.fn().mockResolvedValue([
        {
          name: "ai-interface",
          status: "stopped",
          pm_id: 0,
        },
      ]);

      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: true, online: false });
    });

    it("should return {found:false} when process is not found in pm2 list", async () => {
      // AC-4: Kaynak yok (process bulunamama durumu ayrı test edilmeli)
      // Davranış Sözleşmesi satır 8: Hiçbir şey yapılamadı ama hata yok — process bulunamama
      const mockPm2Jlist = vi.fn().mockResolvedValue([
        {
          name: "other-process",
          status: "online",
          pm_id: 0,
        },
      ]);

      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: false });
    });

    it("should return {found:false} when pm2 jlist returns empty array", async () => {
      const mockPm2Jlist = vi.fn().mockResolvedValue([]);

      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: false });
    });

    it("should handle multiple processes and return correct one", async () => {
      const mockPm2Jlist = vi.fn().mockResolvedValue([
        {
          name: "other-service",
          status: "online",
          pm_id: 0,
        },
        {
          name: "ai-interface",
          status: "online",
          pm_id: 1,
        },
        {
          name: "third-service",
          status: "online",
          pm_id: 2,
        },
      ]);

      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: true, online: true });
    });

    it("should match process by exact name (case-sensitive)", async () => {
      const mockPm2Jlist = vi.fn().mockResolvedValue([
        {
          name: "AI-INTERFACE",
          status: "online",
          pm_id: 0,
        },
      ]);

      // Looking for "ai-interface" (lowercase) but pm2 has "AI-INTERFACE"
      const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);
      expect(result).toEqual({ found: false });
    });
  });

  // ============================================================================
  // Notification payload building — buildNotificationPayload() function
  // ============================================================================
  describe("buildNotificationPayload() — Notification message formatting", () => {
    it("should build DOWN notification with correct structure", () => {
      const payload = buildNotificationPayload("down", {
        url: "https://example.com",
        timestamp: new Date("2025-01-01T12:00:00Z"),
      });

      expect(payload).toEqual(
        expect.objectContaining({
          type: "down",
          message: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
      expect(payload.type).toBe("down");
      expect(payload.message).toContain("example.com");
    });

    it("should build RECOVERED notification with correct structure", () => {
      const payload = buildNotificationPayload("recovered", {
        url: "https://example.com",
        timestamp: new Date("2025-01-01T12:30:00Z"),
      });

      expect(payload).toEqual(
        expect.objectContaining({
          type: "recovered",
          message: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
      expect(payload.type).toBe("recovered");
      expect(payload.message).toContain("example.com");
    });

    it("should throw when type is invalid (not 'down' or 'recovered')", () => {
      // buildNotificationPayload("invalid-type", {...}) THROW eder
      // (geçersiz tip sessizce kabul edilmemeli)
      expect(() => {
        buildNotificationPayload("invalid-type" as any, {
          url: "https://example.com",
        });
      }).toThrow();
    });

    it("should throw when type is 'warning' (unknown type)", () => {
      expect(() => {
        buildNotificationPayload("warning" as any, {
          url: "https://example.com",
        });
      }).toThrow();
    });

    it("should include current timestamp in payload", () => {
      const beforeTime = new Date().toISOString();
      const payload = buildNotificationPayload("down", {
        url: "https://example.com",
      });
      const afterTime = new Date().toISOString();

      // Timestamp should be between before and after
      expect(new Date(payload.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime(),
      );
      expect(new Date(payload.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime(),
      );
    });
  });

  // ============================================================================
  // AC-S1 [High]: Webhook security — sendWebhookNotification() function
  // Davranış Sözleşmesi: Secret management, auth errors, network errors
  // ============================================================================
  describe("AC-S1 [High] & Davranış Sözleşmesi: sendWebhookNotification() — Webhook security and error handling", () => {
    it("should send webhook with correct payload when webhook URL is valid", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const payload = {
        type: "down" as const,
        message: "Site is down",
        timestamp: new Date().toISOString(),
      };

      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        payload,
        mockFetch,
      );

      expect(result).toEqual({ sent: true });
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        "https://webhook.example.com",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.any(String),
        }),
      );
    });

    it("[Davranış Sözleşmesi satır 2] should not call fetch when webhook URL is missing/undefined", async () => {
      // Config hatalı (webhook URL/PM2 ayarı yanlış) — hiç fetch çağrısı yapılmadan {sent:false, reason:"no-webhook-configured"} döner
      const mockFetch = vi.fn();

      const result = await sendWebhookNotification(
        undefined,
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      expect(result).toEqual({ sent: false, reason: "no-webhook-configured" });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("[Davranış Sözleşmesi satır 2] should not call fetch when webhook URL is empty string", async () => {
      const mockFetch = vi.fn();

      const result = await sendWebhookNotification(
        "",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      expect(result).toEqual({ sent: false, reason: "no-webhook-configured" });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("[Davranış Sözleşmesi satır 4] should return {sent:false, reason:'unauthorized'} on HTTP 401 (Unauthorized)", async () => {
      // AC-S1: Yetkisiz erişim (webhook token expired/401)
      // THROW ETMEMELİ, sessiz başarısızlık yerine gözlemlenebilir sonuç döner
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      expect(result).toEqual({ sent: false, reason: "unauthorized" });
    });

    it("[Davranış Sözleşmesi satır 4] should return {sent:false, reason:'unauthorized'} on HTTP 403 (Forbidden)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });

      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      expect(result).toEqual({ sent: false, reason: "unauthorized" });
    });

    it("[Davranış Sözleşmesi satır 5] should return {sent:false, reason:'network-error'} on network failure", async () => {
      // Dış bağımlılık hatası (UptimeRobot/webhook API down)
      // THROW ETMEMELİ, reason ile bildirir
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error: ECONNREFUSED"));

      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      expect(result).toEqual({ sent: false, reason: "network-error" });
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("[Davranış Sözleşmesi satır 5] should return {sent:false, reason:'network-error'} on fetch timeout/abort", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("The operation was aborted"));

      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      expect(result).toEqual({ sent: false, reason: "network-error" });
    });

    it("should handle non-ok HTTP responses gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      // 500 is not 401/403, so it's a different kind of failure
      expect(result.sent).toBe(false);
      // Reason should be something other than "unauthorized" (could be "server-error" or similar)
      expect(result.reason).toBeDefined();
      expect(result.reason).not.toBe("no-webhook-configured");
    });

    it("should not throw on webhook failure — always return {sent, reason?} object", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Any error"));

      // This should NOT throw
      const result = await sendWebhookNotification(
        "https://webhook.example.com",
        {
          type: "down" as const,
          message: "Site is down",
          timestamp: new Date().toISOString(),
        },
        mockFetch,
      );

      // Should return a result object, not throw
      expect(result).toBeDefined();
      expect(result).toHaveProperty("sent");
    });
  });

  // ============================================================================
  // Integration scenarios — combining multiple functions
  // ============================================================================
  describe("Integration: Combining health check + failure threshold + notification logic", () => {
    it("should not send DOWN notification on first failure (AC-6: spam prevention)", () => {
      const isUp = isHealthy(200);
      const failureCount = 1;
      const threshold = 2;

      const isThresholdExceeded = evaluateFailureThreshold(failureCount, threshold);

      expect(isUp).toBe(true); // First: health check passes
      // But imagine second check fails:
      const secondCheck = isHealthy(503);
      expect(secondCheck).toBe(false); // Down

      const shouldNotify = evaluateFailureThreshold(1, threshold);
      expect(shouldNotify).toBe(false); // Still below threshold
    });

    it("should send DOWN notification on second consecutive failure", () => {
      const consecutiveFailures = 2;
      const threshold = 2;

      const shouldNotify = evaluateFailureThreshold(consecutiveFailures, threshold);
      expect(shouldNotify).toBe(true);
    });

    it("should send RECOVERED notification only once (not repeatedly)", () => {
      // First recovery (wasDown=true, isUpNow=true)
      expect(shouldNotifyRecovery(true, true)).toBe(true);

      // Second check after recovery (wasDown=false now, isUpNow=true)
      expect(shouldNotifyRecovery(false, true)).toBe(false);
    });
  });

  // ============================================================================
  // Edge cases and boundary conditions
  // ============================================================================
  describe("Edge cases and boundary conditions", () => {
    it("should handle threshold=0 (all checks trigger notification immediately)", () => {
      expect(evaluateFailureThreshold(0, 0)).toBe(true); // 0 >= 0
      expect(evaluateFailureThreshold(1, 0)).toBe(true);
    });

    it("should handle negative consecutive failures gracefully", () => {
      // Implementation should either reject or treat as 0
      const result = evaluateFailureThreshold(-1, 2);
      expect(typeof result).toBe("boolean");
    });

    it("should handle very large HTTP status codes", () => {
      expect(isHealthy(999)).toBe(false);
    });

    it("should handle zero HTTP status code", () => {
      expect(isHealthy(0)).toBe(false);
    });
  });
});

/**
 * Davranış Sözleşmesi (Behavior Contract) Tests
 * These tests verify the expected behaviors from the atdd.md "Davranış Sözleşmesi" table
 */
describe("Davranış Sözleşmesi: uptime-izleme-pm2-recovery", () => {
  /**
   * Row 1: Happy path (site ayakta)
   * Given site ayaktayken
   * When uptime-check HTTP isteği atar
   * Then 2xx yanıt alınır ve hiçbir bildirim gönderilmez
   */
  it("[Row 1] Happy path: site ayaktayken bildirim gönderilmez", () => {
    const httpStatus = 200;
    const isUp = isHealthy(httpStatus);
    const failureCount = 0;
    const shouldNotify = evaluateFailureThreshold(failureCount, 2);

    expect(isUp).toBe(true);
    expect(shouldNotify).toBe(false); // No notification while healthy
  });

  /**
   * Row 2: Config hatalı (webhook URL/PM2 ayarı yanlış)
   * When kurulumda test-alert başarısız olursa
   * Then kurulum sırasında hemen fark edilir
   */
  it("[Row 2] Config error: webhook URL missing is caught immediately", async () => {
    const mockFetch = vi.fn();
    const result = await sendWebhookNotification(
      undefined, // No webhook URL
      {
        type: "down" as const,
        message: "Test alert",
        timestamp: new Date().toISOString(),
      },
      mockFetch,
    );

    expect(result.sent).toBe(false);
    expect(result.reason).toBe("no-webhook-configured");
    expect(mockFetch).not.toHaveBeenCalled(); // Caught immediately, no fetch attempted
  });

  /**
   * Row 3: Kaynak yok (site/domain yanlış yapılandırılmış)
   * Sürekli fail → N-fail eşiğinden sonra DOWN bildirimi
   */
  it("[Row 3] Source unreachable: fails consistently until threshold", () => {
    // First fail
    expect(evaluateFailureThreshold(1, 2)).toBe(false);
    // Second fail — threshold reached
    expect(evaluateFailureThreshold(2, 2)).toBe(true);
  });

  /**
   * Row 4: Yetkisiz erişim (webhook token expired/401)
   * When bildirim API'den 401/403 alırsa
   * Then log dosyasına yazılır (sessiz başarısızlık YASAK)
   */
  it("[Row 4] Unauthorized: 401/403 is reported, not silent", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await sendWebhookNotification(
      "https://webhook.example.com",
      {
        type: "down" as const,
        message: "Site is down",
        timestamp: new Date().toISOString(),
      },
      mockFetch,
    );

    // Not silent: has a reason field indicating the issue
    expect(result.sent).toBe(false);
    expect(result.reason).toBe("unauthorized");
  });

  /**
   * Row 5: Dış bağımlılık hatası (UptimeRobot/webhook API down)
   * When dış servis down olursa
   * Then log dosyasına yazılır
   */
  it("[Row 5] External dependency failure: network error is reported", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    const result = await sendWebhookNotification(
      "https://webhook.example.com",
      {
        type: "down" as const,
        message: "Site is down",
        timestamp: new Date().toISOString(),
      },
      mockFetch,
    );

    expect(result.sent).toBe(false);
    expect(result.reason).toBe("network-error");
  });

  /**
   * Row 8 (critical): Hiçbir şey yapılamadı ama hata yok — silent failure prevention
   * This is the core problem the task is solving:
   * PM2 process pm2 listesinden düşse bile, uptime-check API call başarılı görünebilir
   */
  it("[Row 8] Silent failure prevention: PM2 process not found is observable, not silent", async () => {
    // When pm2 process cannot be found
    const mockPm2Jlist = vi.fn().mockResolvedValue([]); // Empty list — process not found

    const result = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist);

    // Result should be observable (not silent), distinguishing "not found" from "found but offline"
    expect(result).toEqual({ found: false });
    expect(result.found).toBe(false); // Observable marker that something is wrong
  });

  /**
   * Row 8 (continued): Distinguishing "process not found" from "process offline"
   * This prevents silent crashes where PM2 drops the process but HTTP checks pass
   */
  it("[Row 8] Process offline is distinct from process not found", async () => {
    // Scenario A: Process is errored (found but offline)
    const mockPm2Jlist_A = vi
      .fn()
      .mockResolvedValue([{ name: "ai-interface", status: "errored", pm_id: 0 }]);
    const resultA = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist_A);
    expect(resultA).toEqual({ found: true, online: false });

    // Scenario B: Process is not in PM2 list at all (not found)
    const mockPm2Jlist_B = vi.fn().mockResolvedValue([]);
    const resultB = await checkPm2ProcessStatus("ai-interface", mockPm2Jlist_B);
    expect(resultB).toEqual({ found: false });

    // These are distinguishable — the script can react differently to each
    expect(resultA).not.toEqual(resultB);
  });
});
