import { REPOS } from "./portfolio-data";

interface GitHubStats {
  repoCount: number;
  totalStars: number;
}

interface CacheEntry {
  data: GitHubStats;
  timestamp: number;
}

const CACHE_TTL_MS = 3600000; // 1 hour
let cache: CacheEntry | null = null;

/**
 * Fetch GitHub repository statistics from the public API.
 *
 * - Calls https://api.github.com/users/yutronax/repos
 * - Calculates repoCount and totalStars, treating null/undefined stargazers_count as 0
 * - Implements module-level in-memory cache with 1-hour TTL
 * - Falls back silently to portfolio-data.ts::REPOS constants on any error
 * - Never throws; always returns a valid { repoCount, totalStars } object
 *
 * AC-1 (Critical): Happy path returns API data exactly
 * AC-2 (Critical): 403/429/network errors fall back to REPOS without throwing
 * AC-3 (High): Empty API response (valid state) returns 0/0, not fallback
 * AC-4 (High): null/undefined stargazers_count treated as 0
 * AC-5 (Medium): Results cached with TTL; within window, fetch not re-called
 * AC-6 (Medium): Always returns valid object, never throws
 */
export async function fetchGitHubStats(): Promise<GitHubStats> {
  const now = Date.now();

  // Check cache: if valid and TTL not expired, return cached data
  if (cache !== null && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch("https://api.github.com/users/yutronax/repos", {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If response not ok, fall back without throwing
    if (!response.ok) {
      return getFallbackStats();
    }

    let repos: Array<{ stargazers_count?: number | null }>;
    try {
      repos = await response.json();
    } catch {
      // Malformed JSON: fall back
      return getFallbackStats();
    }

    // Ensure repos is an array
    if (!Array.isArray(repos)) {
      return getFallbackStats();
    }

    // Calculate stats from API response
    // Treat null/undefined stargazers_count as 0 (AC-4)
    const repoCount = repos.length;
    const totalStars = repos.reduce((sum, repo) => {
      const stars = repo.stargazers_count ?? 0;
      return sum + (typeof stars === "number" ? stars : 0);
    }, 0);

    const stats: GitHubStats = { repoCount, totalStars };

    // Cache the result (even if empty, which is valid per AC-3)
    cache = { data: stats, timestamp: now };

    return stats;
  } catch {
    // Network error, timeout, or any other fetch failure: fall back
    return getFallbackStats();
  }
}

/**
 * Return fallback statistics from hard-coded REPOS constant.
 * Used when GitHub API is unavailable, rate-limited, or errors occur.
 */
function getFallbackStats(): GitHubStats {
  const repoCount = REPOS.length;
  const totalStars = REPOS.reduce((sum, repo) => sum + repo.stars, 0);
  return { repoCount, totalStars };
}
