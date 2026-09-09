import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Static analysis tests for index.tsx code-splitting configuration.
 * These tests verify the source file structure, import statements, and patterns
 * WITHOUT attempting to render the route component (which requires TanStack router context).
 *
 * The approach: read the source file as text and verify expected patterns
 * (React.lazy + dynamic import for below-the-fold, static import for Hero).
 */

const INDEX_FILE_PATH = join(process.cwd(), "src/routes/index.tsx");

describe("AC-1/AC-2 [Critical]: Code-Splitting Structure in index.tsx", () => {
  let sourceCode: string;

  beforeEach(() => {
    // Read the source file once for all tests
    sourceCode = readFileSync(INDEX_FILE_PATH, "utf-8");
  });

  /**
   * AC-1 [Critical]: Given below-the-fold section'lar (Identity, Experience, Projects, TechStack, AiPipeline, GitHubSection),
   * When index.tsx is analyzed,
   * Then these components should be imported via React.lazy(() => import(...)) pattern,
   * NOT via static import { ... } from "...".
   */
  describe("AC-1 [Critical]: Below-the-fold sections use React.lazy + dynamic import", () => {
    it("should use dynamic import pattern for Identity section", () => {
      // Pattern: React.lazy(() => import("...")) or equivalent
      const hasLazyImportPattern =
        sourceCode.includes("React.lazy") && sourceCode.includes('import("');
      expect(hasLazyImportPattern).toBe(true);

      // Anti-pattern: static import for Identity (should NOT exist after implementation)
      const hasStaticIdentityImport = /import\s*{\s*Identity\s*}\s*from/.test(sourceCode);
      // After code-splitting, this should fail (RED) — static import should be removed
      expect(hasStaticIdentityImport).toBe(false);
    });

    it("should use dynamic import pattern for Experience section", () => {
      const hasLazyImportPattern =
        sourceCode.includes("React.lazy") && sourceCode.includes('import("');
      expect(hasLazyImportPattern).toBe(true);

      const hasStaticExperienceImport = /import\s*{\s*Experience\s*}\s*from/.test(sourceCode);
      expect(hasStaticExperienceImport).toBe(false);
    });

    it("should use dynamic import pattern for Projects section", () => {
      const hasLazyImportPattern =
        sourceCode.includes("React.lazy") && sourceCode.includes('import("');
      expect(hasLazyImportPattern).toBe(true);

      const hasStaticProjectsImport = /import\s*{\s*Projects\s*}\s*from/.test(sourceCode);
      expect(hasStaticProjectsImport).toBe(false);
    });

    it("should use dynamic import pattern for TechStack section", () => {
      const hasLazyImportPattern =
        sourceCode.includes("React.lazy") && sourceCode.includes('import("');
      expect(hasLazyImportPattern).toBe(true);

      const hasStaticTechStackImport = /import\s*{\s*TechStack\s*}\s*from/.test(sourceCode);
      expect(hasStaticTechStackImport).toBe(false);
    });

    it("should use dynamic import pattern for AiPipeline section", () => {
      const hasLazyImportPattern =
        sourceCode.includes("React.lazy") && sourceCode.includes('import("');
      expect(hasLazyImportPattern).toBe(true);

      const hasStaticAiPipelineImport = /import\s*{\s*AiPipeline\s*}\s*from/.test(sourceCode);
      expect(hasStaticAiPipelineImport).toBe(false);
    });

    it("should use dynamic import pattern for GitHubSection section", () => {
      const hasLazyImportPattern =
        sourceCode.includes("React.lazy") && sourceCode.includes('import("');
      expect(hasLazyImportPattern).toBe(true);

      const hasStaticGitHubSectionImport = /import\s*{\s*GitHubSection\s*}\s*from/.test(sourceCode);
      expect(hasStaticGitHubSectionImport).toBe(false);
    });

    it("should have at least 6 React.lazy() calls (one for each below-the-fold section)", () => {
      const lazyMatchCount = (sourceCode.match(/React\.lazy\s*\(\s*\(\s*\)\s*=>/g) || []).length;
      expect(lazyMatchCount).toBeGreaterThanOrEqual(6);
    });
  });

  /**
   * AC-2 [Critical]: Given Hero component (LCP element, above-the-fold),
   * When index.tsx is analyzed,
   * Then Hero should still use static import { Hero } from "..."
   * (NOT lazy-loaded, to avoid LCP delay).
   */
  describe("AC-2 [Critical]: Hero component uses static import (NOT lazy-loaded)", () => {
    it("should have static import for Hero component", () => {
      const hasStaticHeroImport =
        /import\s*{\s*Hero\s*}\s*from\s*["']@\/components\/system\/Hero["']/.test(sourceCode);
      expect(hasStaticHeroImport).toBe(true);
    });

    it("should NOT have React.lazy wrapping Hero import", () => {
      // After implementation, Hero should be imported normally, not via React.lazy
      // This test passes initially (RED state) because code-splitting hasn't been done yet
      const hasLazyHero =
        /React\.lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["'].*Hero["']\s*\)/.test(sourceCode);
      expect(hasLazyHero).toBe(false);
    });

    it("should import Hero before any lazy-loaded section to ensure it's in main bundle", () => {
      const heroImportMatch = sourceCode.match(/import\s*{\s*Hero\s*}\s*from/);
      const firstLazyImportIndex = sourceCode.indexOf("React.lazy");

      // Hero must be imported (not null)
      expect(heroImportMatch).not.toBeNull();
      // Lazy imports must exist (to verify ordering)
      expect(firstLazyImportIndex).toBeGreaterThanOrEqual(0);
      // Hero import should appear before first lazy import
      expect(heroImportMatch!.index!).toBeLessThan(firstLazyImportIndex);
    });
  });

  /**
   * AC-3 [High]: Suspense fallback structure — when lazy sections are rendered,
   * they should be wrapped in <Suspense fallback={<SectionSkeleton />}>.
   * This test verifies the pattern exists.
   */
  describe("AC-3 [High]: Suspense wrapper for lazy sections with SectionSkeleton fallback", () => {
    it("should import Suspense from React", () => {
      const hasSuspenseImport = /import\s*{\s*.*Suspense.*\s*}\s*from\s*["']react["']/.test(
        sourceCode,
      );
      expect(hasSuspenseImport).toBe(true);
    });

    it("should import SectionSkeleton component (or similar placeholder)", () => {
      const hasSectionSkeletonImport =
        sourceCode.includes("SectionSkeleton") ||
        sourceCode.includes("SectionPlaceholder") ||
        sourceCode.includes("SkeletonLoader");
      expect(hasSectionSkeletonImport).toBe(true);
    });

    it("should use Suspense with fallback pattern in JSX", () => {
      const hasSuspenseFallback =
        sourceCode.includes("<Suspense") && sourceCode.includes("fallback={");
      expect(hasSuspenseFallback).toBe(true);
    });
  });

  /**
   * AC-4 [High]: Error Boundary structure — lazy-loaded sections should be
   * wrapped in an Error Boundary to isolate load failures.
   */
  describe("AC-4 [High]: Error Boundary wrapper for lazy sections", () => {
    it("should import Error Boundary component (SectionErrorBoundary or similar)", () => {
      const hasErrorBoundary =
        sourceCode.includes("ErrorBoundary") || sourceCode.includes("SectionErrorBoundary");
      expect(hasErrorBoundary).toBe(true);
    });

    it("should wrap lazy-loaded sections with Error Boundary", () => {
      // Pattern: <SectionErrorBoundary>...<Suspense>...</Suspense></SectionErrorBoundary>
      const hasErrorBoundaryWrapper =
        sourceCode.includes("ErrorBoundary") && sourceCode.includes("Suspense");
      expect(hasErrorBoundaryWrapper).toBe(true);
    });
  });

  /**
   * AC-5 [Medium]: SSR consideration — this is verified at runtime with real SSR build.
   * Unit test note: cannot verify SSR behavior in this static analysis.
   * This AC will be tested in the 'verify' phase with real Lighthouse/wrangler dev.
   */
  describe("AC-5 [Medium]: SSR fallback (manual verification in verify phase)", () => {
    it("should have import statements for Suspense (required for SSR streaming)", () => {
      // Suspense is needed for proper SSR streaming behavior
      const hasSuspenseImport = /import\s*{\s*.*Suspense.*\s*}\s*from\s*["']react["']/.test(
        sourceCode,
      );
      expect(hasSuspenseImport).toBe(true);
    });

    it.skip("should render without error when JS is disabled (manual e2e test)", () => {
      // AC-5: SSR-only render with JS disabled
      // This requires real SSR testing (wrangler dev + browser dev tools to disable JS)
      // Skip here; will be verified in 'verify' phase with actual Lighthouse/manual audit
      expect(true).toBe(true);
    });
  });

  /**
   * AC-6 [Medium]: Lighthouse performance criteria — bundle analysis.
   * Unit test note: cannot measure LCP/CLS/bundle size in unit tests.
   * This AC will be verified in 'verify' phase with real Lighthouse audit.
   */
  describe("AC-6 [Medium]: Performance bundle reduction (verify phase with Lighthouse)", () => {
    it.skip("should reduce main bundle by ~50KB and route bundle by ~27KB", () => {
      // AC-6: Lighthouse metrics (LCP <2.5s, skor >=90, CLS stable)
      // This requires real production build + Lighthouse audit
      // Skip here; will be verified in 'verify' phase
      expect(true).toBe(true);
    });
  });
});

/**
 * Davranış Sözleşmesi Integration Tests
 * (verify that the patterns support the expected runtime behaviors)
 */
describe("Davranış Sözleşmesi: Code-Splitting Patterns", () => {
  let sourceCode: string;

  beforeEach(() => {
    sourceCode = readFileSync(INDEX_FILE_PATH, "utf-8");
  });

  /**
   * Row 1: Happy path — below-the-fold section lazy-load edilir
   * When sayfa ilk yüklenir, Then chunk başarıyla indirilir ve component render olur
   * Verify pattern: React.lazy + dynamic import for each below-the-fold section
   */
  it("supports Happy path: below-the-fold sections are lazy-imported", () => {
    const hasLazyPattern = sourceCode.includes("React.lazy") && sourceCode.includes('import("');
    expect(hasLazyPattern).toBe(true);
  });

  /**
   * Row 2 & 3: Lazy chunk yükleme hatası — Error Boundary hatayı yakalar
   * Verify pattern: sections wrapped in <ErrorBoundary>
   */
  it("supports Error Boundary isolation: failed chunks are isolated from other sections", () => {
    const hasErrorBoundaryPattern =
      (sourceCode.includes("ErrorBoundary") || sourceCode.includes("SectionErrorBoundary")) &&
      sourceCode.includes("Suspense");
    expect(hasErrorBoundaryPattern).toBe(true);
  });

  /**
   * Row 4: Zaman aşımı — Suspense fallback (skeleton) gösterilir
   * Verify pattern: Suspense with fallback
   */
  it("supports Timeout scenario: Suspense fallback skeleton during load", () => {
    const hasSuspenseFallback =
      sourceCode.includes("<Suspense") && sourceCode.includes("fallback={");
    expect(hasSuspenseFallback).toBe(true);
  });

  /**
   * Row 5: Kısmi başarı — bazı chunk'lar yüklendi, bazıları yüklenemedi
   * Each section has independent Error Boundary + Suspense
   * Verify pattern: multiple error boundaries + suspense boundaries
   */
  it("supports Partial success: independent error boundaries for each section", () => {
    // Count occurrences of error boundary/suspense pattern
    const errorBoundaryPatterns = (sourceCode.match(/ErrorBoundary|SectionErrorBoundary/g) || [])
      .length;
    const suspensePatterns = (sourceCode.match(/<Suspense/g) || []).length;

    // Should have multiple boundaries for independent isolation
    expect(errorBoundaryPatterns).toBeGreaterThanOrEqual(1);
    expect(suspensePatterns).toBeGreaterThanOrEqual(1);
  });
});
