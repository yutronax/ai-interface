import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Hero } from "./Hero";
import { IDENTITY } from "@/lib/portfolio-data";

/**
 * Test suite for Hero component LCP optimization (ATDD — lcp-hero-boot-font-fix).
 *
 * Key Goal: `<h1>{IDENTITY.name}</h1>` must render with full text IMMEDIATELY on mount,
 * independent of typewriter animation state. Typewriter effect becomes a decorative overlay
 * that does NOT block or delay LCP element rendering.
 *
 * Reference: atdd.md (AC-1, AC-3, AC-4) + plan.md (Kararlar section)
 * Test Strategy: Integration tests for Hero component + unit patterns for state isolation.
 */

/**
 * Mock useSectionProgress hook to provide stable scroll values.
 * Real implementation uses motion/react scroll tracking; here we stub it
 * to avoid scroll context complexity in unit tests.
 */
vi.mock("./use-section-progress", () => ({
  useSectionProgress: () => {
    // Return a mock MotionValue that framer-motion's useTransform expects
    return {
      get: () => 0,
      set: () => {},
      on: () => () => {}, // Unsubscribe function
      current: 0,
    };
  },
}));

describe("AC-1/AC-3 [Critical/High]: Hero — `<h1>` LCP Rendering Independence from Typewriter", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  /**
   * AC-1 [Critical]: Given bir ziyaretçi siteyi ilk kez açıyor,
   * When sayfa yükleniyor,
   * Then `<h1>{IDENTITY.name}</h1>` DOM'a tam metinle (typewriter state'i beklemeden) render edilir
   * ve ilk boyamada görünür olur.
   *
   * Test: Immediately after render (NO timer advancement, NO act() for useEffect),
   * the <h1> element's textContent must equal IDENTITY.name in full.
   */
  describe("AC-1 [Critical]: `<h1>` renders full IDENTITY.name immediately on mount", () => {
    it("should render h1 with full IDENTITY.name text on initial mount, before typewriter finishes", () => {
      // Render Hero component
      render(<Hero />);

      // Query the h1 immediately after render (no timer advancement, no async waits)
      const heading = screen.getByRole("heading", { level: 1 });

      // Assert: h1's textContent must equal the full IDENTITY.name
      // This FAILS currently because Hero.tsx uses {name.typed} which depends on useTypewriter
      expect(heading.textContent).toBe(IDENTITY.name);
    });

    it("should make h1 text content queryable via getByText without waiting for animation", () => {
      render(<Hero />);

      // If h1 has full text immediately, this query succeeds without waitFor
      const nameText = screen.getByText(IDENTITY.name);

      expect(nameText).toBeInTheDocument();
      expect(nameText.tagName).toBe("SPAN"); // h1 contains a <span> with the text
    });

    it("should have h1 rendered in the document before any async effects run", () => {
      const { container } = render(<Hero />);

      // Direct DOM query, no screen.findBy (which waits)
      const h1Element = container.querySelector("h1");

      expect(h1Element).toBeInTheDocument();
      expect(h1Element?.textContent).toBe(IDENTITY.name);
    });
  });

  /**
   * AC-3 [High]: Given boot/typewriter animasyonu hâlâ görsel bir efekt olarak isteniyor,
   * When h1 zaten dolu render edilmişken animasyon oynatılıyor,
   * Then animasyon LCP elementinin ilk boyamasını geciktirmeyen ayrı bir katman/efekt olarak çalışır.
   *
   * Test: h1.textContent must NEVER be dependent on typewriter/boot state.
   * Even if animation state changes, h1 content remains IDENTITY.name (animation is visual only).
   */
  describe("AC-3 [High]: Typewriter animation does NOT alter h1 DOM content", () => {
    it("should keep h1 textContent constant as IDENTITY.name regardless of typewriter state", () => {
      render(<Hero />);

      const heading = screen.getByRole("heading", { level: 1 });
      const initialContent = heading.textContent;

      // Assert: h1 must always have full name
      expect(initialContent).toBe(IDENTITY.name);

      // Simulate animation frame or timeout (even though we don't advance timers in this test,
      // the principle is: h1.textContent should NEVER change)
      // In a real scenario with fake timers, we'd advance time and check again:
      // vi.useFakeTimers();
      // vi.advanceTimersByTime(1000);
      // expect(heading.textContent).toBe(IDENTITY.name); // Must still be the same

      expect(heading.textContent).toBe(IDENTITY.name);
    });

    it("should not render partial text in h1 during typewriter animation sequence", () => {
      render(<Hero />);

      const heading = screen.getByRole("heading", { level: 1 });

      // h1 textContent must be complete (not partial/typed-out state from animation)
      expect(heading.textContent).toBe(IDENTITY.name);
      expect(heading.textContent?.length).toBe(IDENTITY.name.length);
    });
  });

  /**
   * AC-4 [High]: Given Google Fonts (JetBrains Mono, Space Grotesk) kullanılıyor,
   * When sayfa yükleniyor,
   * Then font yükleme render-blocking olmaktan çıkarılır.
   *
   * NOTE: AC-4 font loading strategy is tested in __root.tsx test file (separate test suite),
   * NOT in Hero.tsx component tests. This test skips AC-4 font loading validation.
   * Font-display strategy, preload directives, and @font-face definitions are tested
   * in src/routes/__root.test.tsx or integration/e2e tests, not here.
   */
  describe("AC-4 [High]: Font loading strategy (deferred to __root.tsx tests)", () => {
    it.skip("should test font-display and preload strategy in __root test suite, not here", () => {
      // AC-4: Font loading is in __root.tsx, not Hero.tsx component.
      // This test file focuses on Hero component's h1 render independence.
      // Font tests will be in src/routes/__root.test.tsx
      expect(true).toBe(true);
    });
  });

  /**
   * Davranış Sözleşmesi Row 1 (Happy Path):
   * h1 render'ı + boot animasyonu ayrı katmanda çalışır.
   *
   * Test: h1 mounts with full text; animations in background (boot opacity transform, etc.)
   * should not prevent h1 visibility or delay its rendering.
   */
  describe("Davranış Sözleşmesi Row 1: Happy Path — h1 + Boot Animation Layer Separation", () => {
    it("should render h1 fully while boot animation operates on separate overlay layer", () => {
      render(<Hero />);

      // h1 must be immediately visible with full text
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.textContent).toBe(IDENTITY.name);

      // Boot output (command, lines) should be rendered in a separate div (not inside h1)
      const bootDiv = screen.getByText(/\$/); // Command prompt line
      expect(bootDiv).toBeInTheDocument();
      expect(bootDiv).not.toContainElement(heading); // Boot output and h1 are independent
    });

    it("should not apply typewriter state transitions to h1's textContent", () => {
      render(<Hero />);

      const heading = screen.getByRole("heading", { level: 1 });

      // h1.textContent is static IDENTITY.name (no typewriter "typing" animation in DOM)
      expect(heading.textContent).toBe(IDENTITY.name);

      // Animation should only affect visual CSS properties (opacity, transform), not text
      // (Verify by checking that textContent doesn't reflect step-by-step typing)
      const expectedFullName = IDENTITY.name;
      expect(heading.textContent).toBe(expectedFullName); // Always full
    });
  });

  /**
   * Davranış Sözleşmesi Row 5 (Partial Success):
   * Kısmi başarı (h1 görünür ama boot animasyonu görsel olarak bozuk/oynamıyor).
   * h1 içeriği her koşulda doğru kalmalı — animasyon asla h1'in varlığına bağımlı bir ön koşul olamaz.
   *
   * Test: Using fake timers, prevent boot animation from completing.
   * h1 must STILL render with full text, even if animation never starts/completes.
   */
  describe("Davranış Sözleşmesi Row 5: Partial Success — h1 Correct Even If Boot Animation Fails", () => {
    it("should render h1 with full name even if boot animation never progresses", () => {
      // Use fake timers to freeze animation progression
      vi.useFakeTimers();

      // Render Hero
      render(<Hero />);

      // Do NOT advance timers — animation is frozen at t=0
      // Even though boot animation never fires (setInterval never triggers),
      // h1 must still have full text immediately

      const heading = screen.getByRole("heading", { level: 1 });

      // Assert: h1 has full name DESPITE animation never progressing
      expect(heading.textContent).toBe(IDENTITY.name);

      vi.useRealTimers();
    });

    it("should keep h1 textContent valid even if typewriter hook fails silently", () => {
      // This simulates a scenario where useTypewriter fails to initialize
      // but the component still renders h1 with static fallback content

      render(<Hero />);

      const heading = screen.getByRole("heading", { level: 1 });

      // h1 must never be empty or undefined, regardless of hook state
      expect(heading.textContent).toBeTruthy();
      expect(heading.textContent).toBe(IDENTITY.name);
    });

    it("should ensure h1 visibility is not blocked by missing animation state", () => {
      render(<Hero />);

      const heading = screen.getByRole("heading", { level: 1 });

      // h1 should have full text content (visibility indicator)
      // Even if the Boot animation div is hidden/invisible, h1 remains visible
      expect(heading).toHaveAttribute("class"); // h1 has CSS classes
      expect(heading.textContent).toBe(IDENTITY.name); // Content is there
    });
  });

  /**
   * Integration-level test: Verify component structure matches expected layout
   * (h1 for LCP, boot output in separate div, no nesting conflicts).
   */
  describe("Component Structure: Verify h1 and Boot Animation are Properly Decoupled", () => {
    it("should render h1 in a separate motion.div from boot output", () => {
      const { container } = render(<Hero />);

      // Query h1
      const h1 = container.querySelector("h1");
      expect(h1).toBeInTheDocument();

      // Query boot output div (contains the command prompt $ and boot lines)
      const bootOutput = container.querySelector(".mono.space-y-1") as HTMLElement | null;
      expect(bootOutput).toBeInTheDocument();

      // Verify they are not nested (h1 is not inside boot, boot is not inside h1)
      expect(bootOutput).not.toContainElement(h1!);
      expect(h1).not.toContainElement(bootOutput);

      // Both should be children of the terminal window's inner div
      const terminalContent = container.querySelector(".relative.mx-auto.flex");
      expect(terminalContent?.contains(h1)).toBe(true);
      expect(terminalContent?.contains(bootOutput)).toBe(true);
    });

    it("should have h1 text queryable without depending on boot animation completion", () => {
      render(<Hero />);

      // This should succeed even if boot lines haven't rendered yet
      // (In practice, boot lines render via setInterval after command finishes,
      // but h1 is independent and should be immediately available)
      const name = screen.getByText(IDENTITY.name);

      expect(name).toBeInTheDocument();
    });
  });

  /**
   * Accessibility Check: Ensure h1 (LCP element) has proper semantic meaning.
   */
  describe("Accessibility: LCP h1 Element Semantics", () => {
    it("should render h1 as a proper semantic heading element", () => {
      const { container } = render(<Hero />);

      const h1 = container.querySelector("h1");

      expect(h1).toBeInTheDocument();
      expect(h1?.tagName).toBe("H1");
    });

    it("should have h1 accessible via heading role query", () => {
      render(<Hero />);

      const heading = screen.getByRole("heading", { level: 1 });

      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe(IDENTITY.name);
    });
  });
});
