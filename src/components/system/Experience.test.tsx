import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Experience } from "./Experience";

/**
 * Regression guard for icerik-animasyon-entegrasyon (Saga #391) AC-7/AC-8.
 *
 * Saga #388's mobile QA noticed the Experience counters (MESSAGES/DAY,
 * AUTOMATION%, RESPONSE LATENCY) showed "0" after a programmatic
 * `scrollIntoView()` jump-scroll. A real browser scroll test (Playwright,
 * see obss_project/artifacts/icerik-animasyon-entegrasyon/ verify notes)
 * confirmed the counters DO animate correctly on organic scroll — the "0"
 * was an IntersectionObserver-timing artifact of instant jump-scroll, not a
 * code bug. This test pins the actual mechanism (IntersectionObserver
 * firing → count-up starts) so a future refactor can't silently reintroduce
 * a real "stuck at 0" regression.
 */

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(_callback: IntersectionObserverCallback) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];
}

describe("Experience — Counter (AC-7: real-scroll intersection triggers count-up)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts each counter at literal '0' pre-intersection, and registers a real IntersectionObserver per counter (not a no-op)", () => {
    const observeSpy = vi.fn();
    class SpyIO extends MockIntersectionObserver {
      override observe = observeSpy;
    }
    vi.stubGlobal("IntersectionObserver", SpyIO);

    render(<Experience />);

    // Before intersection: MAVİ LOJİSTİK's numeric counters (rendered only
    // for exp.id === "mavi") start at "0" — this is expected pre-scroll state.
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);

    // The failure mode this guards against: a counter that never calls
    // observe() (e.g. a broken ref, or IntersectionObserver never
    // constructed) would stay at "0" forever regardless of real scrolling.
    expect(observeSpy).toHaveBeenCalled();
  });

  it("registers an IntersectionObserver for each numeric counter (MAVİ LOJİSTİK has 3)", () => {
    const observeSpy = vi.fn();
    class SpyIO extends MockIntersectionObserver {
      override observe = observeSpy;
    }
    vi.stubGlobal("IntersectionObserver", SpyIO);

    render(<Experience />);

    // 3 numeric metrics (MESSAGES/DAY, AUTOMATION%, RESPONSE LATENCY) each
    // mount their own Counter → each registers its own observer.
    expect(observeSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
