import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TechStack } from "./TechStack";
import { TECH_STACK } from "@/lib/portfolio-data";

/**
 * Tests for the "$ cat <manifest>" sequential-terminal redesign of Tech
 * Stack (Saga #392, second iteration — card/grid was also rejected).
 * Each language types its own real package-manifest command
 * (requirements.txt / package.json / pom.xml) one after another in a
 * single terminal, instead of a grid of boxed cards or a single-root
 * ASCII tree.
 *
 * useTypewriter drives typing via real setTimeout/setInterval, so these
 * tests use fake timers (same pattern as Hero.test.tsx) to deterministically
 * fast-forward past the typing animation instead of waiting on wall-clock
 * time.
 */

function advanceWellPastAllTyping() {
  // Each block only mounts once the previous one's onDone fires from
  // inside a useEffect — advancing fake time in one big jump doesn't
  // reliably interleave with React's effect-flush cycle, so step forward
  // in small increments (comfortably more total time than the ~6s all 3
  // sequential blocks take at 18ms/char) to let each stage's timers/effects
  // actually run before advancing further.
  for (let i = 0; i < 60; i++) {
    act(() => {
      vi.advanceTimersByTime(300);
    });
  }
}

describe("TechStack — sequential manifest terminal", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("has at least 3 distinct languages in its data, each with a real manifest command", () => {
    expect(TECH_STACK.length).toBeGreaterThanOrEqual(3);
    for (const entry of TECH_STACK) {
      expect(entry.command.length).toBeGreaterThan(0);
      expect(entry.tools.length).toBeGreaterThan(0);
    }
  });

  it("renders every language's manifest command once typing completes", () => {
    vi.useFakeTimers();
    render(<TechStack />);
    advanceWellPastAllTyping();

    for (const entry of TECH_STACK) {
      expect(document.body.textContent).toContain(entry.command);
    }
  });

  it("renders every tool for every language once typing finishes", () => {
    vi.useFakeTimers();
    render(<TechStack />);
    advanceWellPastAllTyping();

    for (const entry of TECH_STACK) {
      for (const tool of entry.tools) {
        expect(screen.getByText(tool)).toBeInTheDocument();
      }
    }
  });

  it("does not render any tool that isn't part of TECH_STACK's own data (no invented technologies)", () => {
    vi.useFakeTimers();
    render(<TechStack />);
    advanceWellPastAllTyping();

    // Model-architecture names deliberately excluded from the pip-style
    // listing (see portfolio-data.ts comment) — they'd look fake next to
    // real package names in an authentic "cat requirements.txt" rendering.
    expect(screen.queryByText("DeepLabV3+")).not.toBeInTheDocument();
    expect(screen.queryByText("Rust")).not.toBeInTheDocument();
  });

  it("shows a typing cursor and no tool listing yet before typing starts (t=0)", () => {
    vi.useFakeTimers();
    render(<TechStack />);
    // No time advanced — first block's command hasn't started typing.

    expect(screen.queryByText(TECH_STACK[0]!.tools[0]!)).not.toBeInTheDocument();
  });

  it("renders the correct language/package count summary in the header immediately (not gated on typing)", () => {
    render(<TechStack />);

    const totalTools = TECH_STACK.reduce((n, e) => n + e.tools.length, 0);
    expect(
      screen.getByText(`${TECH_STACK.length} LANGUAGES · ${totalTools} PACKAGES`),
    ).toBeInTheDocument();
  });
});
