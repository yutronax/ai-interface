import { REPOS } from "./portfolio-data";

interface GitHubStats {
  repoCount: number;
  totalStars: number;
}

export interface GitHubRepoDetail {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

interface RawRepo {
  name: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number | null;
  html_url?: string;
}

interface CacheEntry {
  data: RawRepo[];
  timestamp: number;
}

const CACHE_TTL_MS = 3600000; // 1 hour
let cache: CacheEntry | null = null;

/**
 * Fetch and cache the raw GitHub repos response. Shared by fetchGitHubStats()
 * and fetchGitHubRepoDetails() so both derive from a single HTTP call per
 * cache window instead of two.
 *
 * Returns null on any failure (non-ok response, network error, malformed/
 * non-array JSON) — callers fall back to their own defaults, this never throws.
 */
async function fetchRawRepos(): Promise<RawRepo[] | null> {
  const now = Date.now();

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

    if (!response.ok) {
      return null;
    }

    let repos: RawRepo[];
    try {
      repos = await response.json();
    } catch {
      return null;
    }

    if (!Array.isArray(repos)) {
      return null;
    }

    cache = { data: repos, timestamp: now };
    return repos;
  } catch {
    return null;
  }
}

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
  const repos = await fetchRawRepos();
  if (repos === null) {
    return getFallbackStats();
  }

  // Treat null/undefined stargazers_count as 0 (AC-4)
  const repoCount = repos.length;
  const totalStars = repos.reduce((sum, repo) => {
    const stars = repo.stargazers_count ?? 0;
    return sum + (typeof stars === "number" ? stars : 0);
  }, 0);

  return { repoCount, totalStars };
}

/**
 * Fetch per-repo details (description/language/stars/url) for enriching the
 * GitHubSection repo table with live data instead of the static REPOS
 * constant's stars/language fields.
 *
 * Reuses the same cached response as fetchGitHubStats() — never issues an
 * extra HTTP request on its own.
 *
 * On any failure, returns an empty array (never throws) — callers merge
 * against REPOS and keep the static value for any repo with no live match,
 * per icerik-animasyon-entegrasyon's AC-3 fallback contract.
 */
export async function fetchGitHubRepoDetails(): Promise<GitHubRepoDetail[]> {
  const repos = await fetchRawRepos();
  if (repos === null) {
    return [];
  }

  return repos.map((repo) => ({
    name: repo.name,
    description: repo.description ?? null,
    language: repo.language ?? null,
    stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
    url: repo.html_url ?? `https://github.com/yutronax/${repo.name}`,
  }));
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
