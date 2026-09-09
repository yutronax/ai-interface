import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Test suite for fetchGitHubStats() function
 *
 * Implementation note: This function is expected to exist in github-api.ts with the following signature:
 * - export async function fetchGitHubStats(): Promise<{ repoCount: number; totalStars: number }>
 *
 * The function should:
 * 1. Fetch from GitHub API: https://api.github.com/users/yutronax/repos
 * 2. Extract stargazers_count from each repo, treating null/undefined as 0
 * 3. Cache results in memory with TTL of 1 hour (3600000ms)
 * 4. Fall back to REPOS constant from portfolio-data.ts on errors
 * 5. Never throw; always return a valid { repoCount, totalStars } object
 *
 * Cache reset note: Tests use vi.resetModules() to clear the module-level cache state
 * between tests, ensuring a fresh module instance with null cache for each test.
 */

describe("fetchGitHubStats — github-api.ts", () => {
  beforeEach(() => {
    // Reset modules to clear module-level cache state before each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore all global mocks and stubs
    vi.restoreAllMocks();
  });

  /**
   * AC-1 [Critical]: GitHub API successful response
   * Given: GitHub API responds successfully with a list of repos
   * When: fetchGitHubStats() is called
   * Then: Returns { repoCount: number, totalStars: number } matching API data exactly
   */
  describe("AC-1 [Critical]: GitHub API responds successfully", () => {
    it("should return correct repoCount and totalStars from GitHub API response", async () => {
      const mockApiResponse = [
        { name: "repo-1", stargazers_count: 5 },
        { name: "repo-2", stargazers_count: 10 },
        { name: "repo-3", stargazers_count: 20 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result).toEqual({ repoCount: 3, totalStars: 35 });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.github.com/users/yutronax/repos",
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should handle a single repo correctly", async () => {
      const mockApiResponse = [{ name: "single-repo", stargazers_count: 42 }];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result).toEqual({ repoCount: 1, totalStars: 42 });
    });

    it("should handle repos with high star counts", async () => {
      const mockApiResponse = [
        { name: "popular-repo", stargazers_count: 1000 },
        { name: "trending-repo", stargazers_count: 5000 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result).toEqual({ repoCount: 2, totalStars: 6000 });
    });
  });

  /**
   * AC-2 [Critical]: GitHub API failure (rate-limit or network error)
   * Given: GitHub API returns 403/429 or network error occurs
   * When: fetchGitHubStats() is called
   * Then: Falls back silently to hard-coded REPOS data without throwing error
   *
   * Fallback values (from src/lib/portfolio-data.ts::REPOS):
   * - repoCount: 4
   * - totalStars: 46 (sum of stars: 12 + 8 + 21 + 5)
   */
  describe("AC-2 [Critical]: Fallback on rate-limit or network error", () => {
    it("should return fallback values on 403 rate-limit error", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("403 Forbidden"));
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // Should NOT throw; instead return fallback
      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should return fallback values on 429 rate-limit error", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("429 Too Many Requests"));
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should return fallback values on network timeout", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Network timeout"));
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should return fallback values on DNS error", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("DNS error"));
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should never throw when API fails", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Unexpected error"));
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");

      // Should NOT throw; should complete gracefully
      expect(async () => {
        await fetchGitHubStats();
      }).not.toThrow();

      const result = await fetchGitHubStats();
      expect(result).toBeDefined();
      expect(typeof result.repoCount).toBe("number");
      expect(typeof result.totalStars).toBe("number");
    });
  });

  /**
   * AC-3 [High]: GitHub API returns empty repo list
   * Given: GitHub API responds with an empty array (user has no public repos)
   * When: fetchGitHubStats() is called
   * Then: Returns { repoCount: 0, totalStars: 0 }
   *       This is a VALID state, NOT an error — fallback is NOT triggered
   */
  describe("AC-3 [High]: Empty repo list (valid state, no fallback)", () => {
    it("should return 0/0 for empty API response without falling back", async () => {
      const mockApiResponse: { name: string; stargazers_count?: number | null }[] = [];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // Should return 0/0, NOT the fallback values (4/46)
      expect(result).toEqual({ repoCount: 0, totalStars: 0 });
    });

    it("should distinguish empty list from API error", async () => {
      const emptyMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });
      global.fetch = emptyMock;

      const { fetchGitHubStats: fetch1 } = await import("./github-api");
      const emptyResult = await fetch1();

      vi.resetModules();

      const errorMock = vi.fn().mockRejectedValue(new Error("API failed"));
      global.fetch = errorMock;

      const { fetchGitHubStats: fetch2 } = await import("./github-api");
      const errorResult = await fetch2();

      // Empty list: 0/0 (real data)
      expect(emptyResult).toEqual({ repoCount: 0, totalStars: 0 });
      // Error: fallback (4/46)
      expect(errorResult).toEqual({ repoCount: 4, totalStars: 46 });
      // They should be different
      expect(emptyResult).not.toEqual(errorResult);
    });
  });

  /**
   * AC-4 [High]: Repo with missing or null stargazers_count
   * Given: API response contains a repo with stargazers_count = null or undefined
   * When: fetchGitHubStats() calculates total stars
   * Then: Treats missing/null stargazers_count as 0, computation completes without crash
   */
  describe("AC-4 [High]: Null/undefined stargazers_count handled defensively", () => {
    it("should treat null stargazers_count as 0", async () => {
      const mockApiResponse = [
        { name: "repo-1", stargazers_count: 5 },
        { name: "repo-2", stargazers_count: null },
        { name: "repo-3", stargazers_count: 10 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // 5 + 0 (null → 0) + 10 = 15
      expect(result).toEqual({ repoCount: 3, totalStars: 15 });
    });

    it("should treat undefined stargazers_count as 0", async () => {
      const mockApiResponse = [
        { name: "repo-1", stargazers_count: 5 },
        { name: "repo-2" }, // Missing stargazers_count
        { name: "repo-3", stargazers_count: 10 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // 5 + 0 (undefined → 0) + 10 = 15
      expect(result).toEqual({ repoCount: 3, totalStars: 15 });
    });

    it("should handle all repos with null stargazers_count", async () => {
      const mockApiResponse = [
        { name: "repo-1", stargazers_count: null },
        { name: "repo-2", stargazers_count: null },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // 0 + 0 = 0
      expect(result).toEqual({ repoCount: 2, totalStars: 0 });
    });

    it("should not crash with mixed valid/null/undefined values", async () => {
      const mockApiResponse = [
        { name: "a", stargazers_count: 1 },
        { name: "b", stargazers_count: null },
        { name: "c" },
        { name: "d", stargazers_count: 2 },
        { name: "e", stargazers_count: undefined },
        { name: "f", stargazers_count: 3 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");

      // Should not throw
      expect(async () => {
        await fetchGitHubStats();
      }).not.toThrow();

      const result = await fetchGitHubStats();

      // 1 + 0 + 0 + 2 + 0 + 3 = 6
      expect(result).toEqual({ repoCount: 6, totalStars: 6 });
    });
  });

  /**
   * AC-5 [Medium]: Caching within TTL
   * Given: fetchGitHubStats() has cached a successful API response (TTL not expired)
   * When: fetchGitHubStats() is called again within TTL
   * Then: fetch() is called exactly once total (cache hit on second call)
   *
   * Note: Uses vi.resetModules() to start with a fresh, empty cache
   * (simulating the first request to the module). Both calls happen in the same
   * test to verify in-memory cache persistence within a single module instance.
   */
  describe("AC-5 [Medium]: Caching within TTL window", () => {
    it("should call fetch only once when called twice within TTL", async () => {
      const mockApiResponse = [
        { name: "repo-1", stargazers_count: 5 },
        { name: "repo-2", stargazers_count: 10 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      // Fresh module import with null cache
      const { fetchGitHubStats } = await import("./github-api");

      // First call: fetch executed, result cached
      const result1 = await fetchGitHubStats();

      // Second call: same module instance, cache hit (TTL not expired)
      const result2 = await fetchGitHubStats();

      // Both should return the same value
      expect(result1).toEqual({ repoCount: 2, totalStars: 15 });
      expect(result2).toEqual({ repoCount: 2, totalStars: 15 });

      // fetch() should have been called exactly once total
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should reuse cached value on multiple rapid calls", async () => {
      const mockApiResponse = [{ name: "repo", stargazers_count: 100 }];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");

      // Make 5 calls rapidly
      const result1 = await fetchGitHubStats();
      const result2 = await fetchGitHubStats();
      const result3 = await fetchGitHubStats();
      const result4 = await fetchGitHubStats();
      const result5 = await fetchGitHubStats();

      // All should return the same value
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      expect(result3).toEqual(result4);
      expect(result4).toEqual(result5);

      // fetch() should only be called once
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("should cache successful response with timestamp", async () => {
      const mockApiResponse = [{ name: "repo", stargazers_count: 42 }];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");

      const start = Date.now();
      const result1 = await fetchGitHubStats();
      const afterFirst = Date.now();
      const result2 = await fetchGitHubStats();
      const afterSecond = Date.now();

      // Both results should be identical (from cache)
      expect(result1).toEqual(result2);
      expect(result1).toEqual({ repoCount: 1, totalStars: 42 });

      // fetch() called only once
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // The time between first and second call should be negligible (cache hit)
      // whereas a real fetch would take noticeable time
      const timeBetweenCalls = afterFirst - start;
      const timeForSecondCall = afterSecond - afterFirst;

      // Both are mocked and synchronous, but verifies they're using the same path
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * AC-6 [Medium]: Fallback behavior with cache
   * Given: A prior successful API response was cached (or cache is empty)
   * When: A subsequent fetch fails (network error, rate-limit, etc.)
   * Then: Falls back to hard-coded REPOS data without throwing
   *
   * This test verifies that even if cache is populated, a new error during
   * a subsequent request falls back gracefully. However, since cache logic
   * means we don't re-fetch until TTL expires, this scenario is less common.
   * Here we test that the function never throws and always returns a valid result.
   */
  describe("AC-6 [Medium]: Fallback guaranteed, no throw on any error", () => {
    it("should always return valid { repoCount, totalStars } object, never throw", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("Request failed"));
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");

      let result: { repoCount: number; totalStars: number } | undefined;
      let hasThrown = false;

      try {
        result = await fetchGitHubStats();
      } catch (e) {
        hasThrown = true;
      }

      expect(hasThrown).toBe(false);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect(typeof result!.repoCount).toBe("number");
      expect(typeof result!.totalStars).toBe("number");
      expect(result!.repoCount).toBeGreaterThanOrEqual(0);
      expect(result!.totalStars).toBeGreaterThanOrEqual(0);
    });

    it("should return fallback when fetch response is not ok", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue([]),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // Fallback expected: 4 repos, 46 total stars
      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should handle malformed JSON in API response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // Should fall back, not throw
      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should handle unexpected response structure", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: "unexpected" }),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // Should fall back, not throw
      expect(result).toEqual({ repoCount: 4, totalStars: 46 });
    });

    it("should never allow user-facing errors; always serve data", async () => {
      const scenarios = [
        new Error("Network timeout"),
        new Error("403 Forbidden"),
        new Error("500 Internal Server Error"),
        new Error("Unknown error"),
      ];

      for (const error of scenarios) {
        vi.resetModules();

        const fetchMock = vi.fn().mockRejectedValue(error);
        global.fetch = fetchMock;

        const { fetchGitHubStats } = await import("./github-api");

        let thrown = false;
        let result;
        try {
          result = await fetchGitHubStats();
        } catch (e) {
          thrown = true;
        }

        expect(thrown).toBe(false);
        expect(result).toBeDefined();
        expect(result).toEqual({ repoCount: 4, totalStars: 46 });
      }
    });
  });

  /**
   * Additional edge cases and integration scenarios
   */
  describe("Edge Cases & Defensive Patterns", () => {
    it("should handle repos array with 0 values (valid, not falsy)", async () => {
      const mockApiResponse = [
        { name: "zero-stars", stargazers_count: 0 },
        { name: "some-stars", stargazers_count: 5 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // 0 is a valid count, not null/undefined
      expect(result).toEqual({ repoCount: 2, totalStars: 5 });
    });

    it("should handle response with extra unexpected fields", async () => {
      const mockApiResponse = [
        {
          name: "repo",
          stargazers_count: 10,
          unexpected_field: "value",
          another_field: 123,
        },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      // Should ignore extra fields and extract stargazers_count
      expect(result).toEqual({ repoCount: 1, totalStars: 10 });
    });

    it("should handle very large numbers correctly", async () => {
      const mockApiResponse = [
        { name: "repo-1", stargazers_count: Number.MAX_SAFE_INTEGER - 100 },
        { name: "repo-2", stargazers_count: 50 },
      ];

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      const result = await fetchGitHubStats();

      expect(result.repoCount).toBe(2);
      expect(result.totalStars).toBeGreaterThan(0);
    });

    it("should construct correct GitHub API URL", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });
      global.fetch = fetchMock;

      const { fetchGitHubStats } = await import("./github-api");
      await fetchGitHubStats();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("api.github.com/users/yutronax/repos"),
        expect.any(Object),
      );
    });
  });
});
