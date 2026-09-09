import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { SectionErrorBoundary } from "./SectionErrorBoundary";

/**
 * Test suite for SectionErrorBoundary class component.
 * SectionErrorBoundary is a React Error Boundary (class component) that:
 * - Catches errors from lazy-loaded child components
 * - Displays a user-friendly error message
 * - Prevents the entire page from crashing (isolates errors to one section)
 * - Provides a "Retry" button to reload the section
 *
 * Note: SectionErrorBoundary component does not exist yet (implementation pending).
 * These tests define the expected behavior and will be RED until implementation is done.
 */

// Mock component that throws an error on render
// Used to trigger Error Boundary's componentDidCatch
function ThrowingComponent(): never {
  throw new Error("Simulated chunk load failure");
}

// Safe wrapper component for testing
function SuccessfulComponent() {
  return <div>Section loaded successfully</div>;
}

describe("AC-4 [High]: SectionErrorBoundary — Error Isolation & Recovery", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * AC-4 [High]: Given bir lazy chunk yüklemesi ağ hatasıyla başarısız olur,
   * When bu gerçekleşir,
   * Then o section'a özel bir Error Boundary hatayı yakalar,
   * nazik bir hata mesajı gösterir; sayfanın geri kalanı çalışmaya devam eder.
   */
  describe("AC-4 [Critical]: Error Boundary catches and displays errors gracefully", () => {
    it("should catch error thrown by child component and display error UI instead of crashing", () => {
      // Suppress console.error for this test (React logs caught errors)
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      // Error message should be displayed to user
      const errorMessage = screen.queryByText(/unable.*load|error.*section|failed/i);
      expect(errorMessage).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should display user-friendly error message when component fails to load", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      // Look for error UI (message, icon, etc.)
      const errorText =
        screen.queryByText(/unable/i) ||
        screen.queryByText(/yüklenmedi/i) ||
        screen.queryByText(/error/i);

      expect(errorText).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should render a 'Retry' or 'Reload' button to allow user recovery", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      // Retry/Reload button should be present
      const retryButton = screen.queryByRole("button", {
        name: /retry|reload|try again/i,
      });
      expect(retryButton).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should not display error UI when children render successfully", () => {
      render(
        <SectionErrorBoundary>
          <SuccessfulComponent />
        </SectionErrorBoundary>,
      );

      // Success content should be visible
      const successContent = screen.getByText(/loaded successfully/i);
      expect(successContent).toBeInTheDocument();

      // No error message should appear
      const errorMessage = screen.queryByText(/error|unable|failed/i);
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  /**
   * Davranış Sözleşmesi Row 2 & 3: Lazy chunk yükleme hatası — Error Boundary yakalar
   * Section-specific error isolation: bir section'ın hatası diğerlerini etkilememelidir.
   *
   * Test scenario: Multiple sections with independent Error Boundaries
   * One section fails → other sections continue to work
   */
  describe("Davranış Sözleşmesi Row 2/3/5: Partial Success — Independent Error Isolation", () => {
    it("should isolate error to one section without affecting sibling sections", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { container } = render(
        <div>
          {/* Section 1: Success */}
          <SectionErrorBoundary>
            <SuccessfulComponent />
          </SectionErrorBoundary>

          {/* Section 2: Error */}
          <SectionErrorBoundary>
            <ThrowingComponent />
          </SectionErrorBoundary>

          {/* Section 3: Success (should still work) */}
          <SectionErrorBoundary>
            <SuccessfulComponent />
          </SectionErrorBoundary>
        </div>,
      );

      // First section should render successfully
      const firstSuccess = screen.getAllByText(/loaded successfully/i);
      expect(firstSuccess.length).toBeGreaterThanOrEqual(2);

      // Middle section should show error (but not crash entire page)
      const errorMessages = container.querySelectorAll("div:has-text('/error|unable|failed/i')");
      // Error should be displayed in middle section
      const errorUI = screen.queryByText(/error|unable|failed/i);
      expect(errorUI).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should allow multiple sections to have independent error boundaries", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { container } = render(
        <div>
          <SectionErrorBoundary>
            <SuccessfulComponent />
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <SuccessfulComponent />
          </SectionErrorBoundary>
          <SectionErrorBoundary>
            <SuccessfulComponent />
          </SectionErrorBoundary>
        </div>,
      );

      // All successful sections should render
      const allSuccess = screen.getAllByText(/loaded successfully/i);
      expect(allSuccess).toHaveLength(3);

      consoleErrorSpy.mockRestore();
    });

    it("should render error only in failed section when multiple sections exist", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { container } = render(
        <div>
          {/* Section 1: Works */}
          <div data-testid="section-1">
            <SectionErrorBoundary>
              <SuccessfulComponent />
            </SectionErrorBoundary>
          </div>

          {/* Section 2: Fails */}
          <div data-testid="section-2">
            <SectionErrorBoundary>
              <ThrowingComponent />
            </SectionErrorBoundary>
          </div>

          {/* Section 3: Works */}
          <div data-testid="section-3">
            <SectionErrorBoundary>
              <SuccessfulComponent />
            </SectionErrorBoundary>
          </div>
        </div>,
      );

      // Section 1 should have success content
      const section1 = container.querySelector('[data-testid="section-1"]');
      expect(section1?.textContent).toContain("loaded successfully");

      // Section 2 should have error UI
      const section2 = container.querySelector('[data-testid="section-2"]');
      expect(section2?.textContent).toMatch(/error|unable|failed/i);

      // Section 3 should have success content
      const section3 = container.querySelector('[data-testid="section-3"]');
      expect(section3?.textContent).toContain("loaded successfully");

      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * AC-4 edge case: Retry button functionality
   * When user clicks retry, component should attempt to reload/recover
   */
  describe("AC-4 Edge Case: Retry Button Behavior", () => {
    it("should call window.location.reload when retry button is clicked", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock window.location.reload
      const reloadSpy = vi.spyOn(window.location, "reload");

      const user = userEvent.setup();
      render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      const retryButton = screen.queryByRole("button", {
        name: /retry|reload|try again/i,
      });
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton!);

      // Reload should be called (or component state should reset)
      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should remain in error state until retry is triggered", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { rerender } = render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      // First render: error should be shown
      let errorUI = screen.queryByText(/error|unable|failed/i);
      expect(errorUI).toBeInTheDocument();

      // Rerender (without user interaction): error should still be shown
      rerender(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      errorUI = screen.queryByText(/error|unable|failed/i);
      expect(errorUI).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * AC-4 implementation detail: componentDidCatch behavior
   * Verify Error Boundary catches errors during render lifecycle
   */
  describe("AC-4 Implementation: componentDidCatch lifecycle", () => {
    it("should implement componentDidCatch to capture render errors", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Component should not crash when child throws
      expect(() => {
        render(
          <SectionErrorBoundary>
            <ThrowingComponent />
          </SectionErrorBoundary>,
        );
      }).not.toThrow();

      // Error UI should be rendered instead
      const errorMessage = screen.queryByText(/error|unable|failed/i);
      expect(errorMessage).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should not propagate error to parent component tree", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { container } = render(
        <div>
          <p>Parent content</p>
          <SectionErrorBoundary>
            <ThrowingComponent />
          </SectionErrorBoundary>
          <p>Sibling content</p>
        </div>,
      );

      // Parent and sibling content should still render
      expect(screen.getByText("Parent content")).toBeInTheDocument();
      expect(screen.getByText("Sibling content")).toBeInTheDocument();

      // Error should be contained within Error Boundary
      const errorUI = screen.queryByText(/error|unable|failed/i);
      expect(errorUI).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * AC-4 accessibility: Error UI should be keyboard accessible
   */
  describe("AC-4 Accessibility: Error UI is keyboard accessible", () => {
    it("should have focusable retry button for keyboard users", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      const retryButton = screen.queryByRole("button", {
        name: /retry|reload|try again/i,
      });

      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute("tabIndex");

      consoleErrorSpy.mockRestore();
    });

    it("should display error message in plain text for screen readers", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <SectionErrorBoundary>
          <ThrowingComponent />
        </SectionErrorBoundary>,
      );

      // Error message should be accessible text, not just visual
      const errorText =
        screen.queryByText(/unable|error|failed/i) || screen.queryByText(/yüklenmedi/i);

      expect(errorText).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  /**
   * Note: AC-5 (SSR/JS disabled) and AC-6 (Lighthouse metrics)
   * are not applicable to unit tests for Error Boundary component.
   * These will be verified in the 'verify' phase with real SSR build and Lighthouse audit.
   */
  describe("AC-5/AC-6: SSR and Lighthouse (verify phase)", () => {
    it.skip("should render error gracefully in SSR-only context (JS disabled)", () => {
      // AC-5: Requires real SSR testing, skip in unit tests
      // Will verify with: wrangler dev --local + browser DevTools JS disable
      expect(true).toBe(true);
    });

    it.skip("should not impact CLS metric when error is shown", () => {
      // AC-6: Requires real Lighthouse audit, skip in unit tests
      // Will verify with: bun run build + Lighthouse measurement
      expect(true).toBe(true);
    });
  });
});
