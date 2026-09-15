import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GitHubSection } from "./GitHubSection";
import { REPOS } from "@/lib/portfolio-data";
import type { GitHubRepoDetail } from "@/lib/github-api";

/**
 * Tests for icerik-animasyon-entegrasyon (Saga #391) — GitHubSection repo
 * table merges REPOS (curated type/stack/activity) with live repoDetails
 * (language/stars/url/description) by repo name.
 */

const stats = { repoCount: 4, totalStars: 46 };

describe("GitHubSection — live repo detail merge (AC-1/AC-2/AC-3/AC-4)", () => {
  it("AC-3: renders REPOS static values unchanged when repoDetails is empty (fallback)", () => {
    render(<GitHubSection stats={stats} repoDetails={[]} />);

    const firstRepo = REPOS[0]!;
    expect(screen.getByText(firstRepo.name)).toBeInTheDocument();
    expect(screen.getAllByText(firstRepo.language).length).toBeGreaterThan(0);
  });

  it("AC-3: renders REPOS static values unchanged when repoDetails prop is omitted entirely", () => {
    render(<GitHubSection stats={stats} />);

    const firstRepo = REPOS[0]!;
    expect(screen.getByText(firstRepo.name)).toBeInTheDocument();
  });

  it("AC-1/AC-2: overrides language and stars with live data when a name match exists", () => {
    const firstRepo = REPOS[0]!;
    const repoDetails: GitHubRepoDetail[] = [
      {
        name: firstRepo.name,
        description: "Live description from API",
        language: "Rust",
        stars: 999,
        url: `https://github.com/yutronax/${firstRepo.name}`,
      },
    ];

    render(<GitHubSection stats={stats} repoDetails={repoDetails} />);

    expect(screen.getByText("Rust")).toBeInTheDocument();
    expect(screen.getByText(/999/)).toBeInTheDocument();
    // Scoped to the repo row itself — the summary strip's "PRIMARY LANG"
    // stat is a separate, hardcoded "Python" value unrelated to this repo's
    // language, so a page-wide query would false-negative here.
    const row = screen.getByText(firstRepo.name).closest("a");
    expect(row?.textContent).not.toContain(firstRepo.language);
  });

  it("AC-4: renders a '—' placeholder when live language is null", () => {
    const firstRepo = REPOS[0]!;
    const repoDetails: GitHubRepoDetail[] = [
      {
        name: firstRepo.name,
        description: null,
        language: null,
        stars: 3,
        url: `https://github.com/yutronax/${firstRepo.name}`,
      },
    ];

    render(<GitHubSection stats={stats} repoDetails={repoDetails} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("keeps REPOS's curated type/stack/activity even when a live match exists", () => {
    const firstRepo = REPOS[0]!;
    const repoDetails: GitHubRepoDetail[] = [
      {
        name: firstRepo.name,
        description: "x",
        language: "Rust",
        stars: 1,
        url: `https://github.com/yutronax/${firstRepo.name}`,
      },
    ];

    render(<GitHubSection stats={stats} repoDetails={repoDetails} />);

    expect(screen.getByText(firstRepo.stack)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(firstRepo.activity, "i"))).toBeInTheDocument();
  });

  it("uses the live html_url as the row's href when a match exists, REPOS repos otherwise link to the profile", () => {
    const firstRepo = REPOS[0]!;
    const repoDetails: GitHubRepoDetail[] = [
      {
        name: firstRepo.name,
        description: null,
        language: firstRepo.language,
        stars: firstRepo.stars,
        url: "https://github.com/yutronax/flood-detection",
      },
    ];

    render(<GitHubSection stats={stats} repoDetails={repoDetails} />);

    const link = screen.getByText(firstRepo.name).closest("a");
    expect(link).toHaveAttribute("href", "https://github.com/yutronax/flood-detection");
  });

  describe("AC-S1 [threat-model]: description is never rendered as markup", () => {
    it("passes an HTML/script-like description through the title attribute only, never dangerouslySetInnerHTML", () => {
      const firstRepo = REPOS[0]!;
      const malicious = "<img src=x onerror=alert(1)>";
      const repoDetails: GitHubRepoDetail[] = [
        {
          name: firstRepo.name,
          description: malicious,
          language: firstRepo.language,
          stars: firstRepo.stars,
          url: `https://github.com/yutronax/${firstRepo.name}`,
        },
      ];

      const { container } = render(<GitHubSection stats={stats} repoDetails={repoDetails} />);

      // The malicious string must appear ONLY as an escaped title attribute
      // value (React escapes attributes too), never as literal markup that
      // would create a real <img>/<script> element in the DOM.
      const link = screen.getByText(firstRepo.name).closest("a");
      expect(link).toHaveAttribute("title", malicious);
      expect(container.querySelector("img[onerror]")).toBeNull();
      expect(container.querySelector("script")).toBeNull();
    });
  });
});
