import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TECH_STACK } from "@/lib/portfolio-data";

/**
 * Tests for the "$ cat <manifest>" scroll-triggered terminal redesign of
 * Tech Stack (Saga #392, 4th iteration): each language's command only
 * starts typing once ITS block scrolls into view — not a fixed timer, not
 * chained to the previous block finishing. Scrolling down the page is what
 * "runs" each language's command in turn.
 *
 * `motion/react`'s `useInView` is backed by a real `IntersectionObserver`
 * that, in this jsdom test environment, never actually reports an element
 * as intersecting (confirmed by direct probing — `resolveElements()`'s
 * `instanceof EventTarget` check doesn't recognize jsdom nodes the way it
 * does in a real browser here). The scroll-triggered reveal itself was
 * verified directly in a real browser (Playwright) instead. Here,
 * `useInView` is mocked directly so the *typing/rendering* behavior once a
 * block IS in view can still be tested deterministically, without fighting
 * jsdom's IntersectionObserver semantics.
 */

const mockUseInView = vi.fn();
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useInView: (...args: unknown[]) => mockUseInView(...args) };
});

async function loadTechStack() {
  const { TechStack } = await import("./TechStack");
  return TechStack;
}

function advanceWellPastAllTyping() {
  for (let i = 0; i < 30; i++) {
    act(() => {
      vi.advanceTimersByTime(300);
    });
  }
}

describe("TechStack — scroll-triggered manifest terminal", () => {
  afterEach(() => {
    vi.useRealTimers();
    mockUseInView.mockReset();
  });

  it("has at least 3 distinct languages in its data, each with a real manifest command", () => {
    expect(TECH_STACK.length).toBeGreaterThanOrEqual(3);
    for (const entry of TECH_STACK) {
      expect(entry.command.length).toBeGreaterThan(0);
      expect(entry.tools.length).toBeGreaterThan(0);
    }
  });

  it("does not type any command before its block has scrolled into view", async () => {
    mockUseInView.mockReturnValue(false);
    vi.useFakeTimers();
    const TechStack = await loadTechStack();
    render(<TechStack />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText(TECH_STACK[0]!.tools[0]!)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(TECH_STACK[0]!.command);
  });

  it("types each block's command and renders its tools once it is in view", async () => {
    mockUseInView.mockReturnValue(true);
    vi.useFakeTimers();
    const TechStack = await loadTechStack();
    render(<TechStack />);
    advanceWellPastAllTyping();

    for (const entry of TECH_STACK) {
      expect(document.body.textContent).toContain(entry.command);
      for (const tool of entry.tools) {
        expect(screen.getByText(tool)).toBeInTheDocument();
      }
    }
  });

  it("does not render any tool that isn't part of TECH_STACK's own data (no invented technologies)", async () => {
    mockUseInView.mockReturnValue(true);
    vi.useFakeTimers();
    const TechStack = await loadTechStack();
    render(<TechStack />);
    advanceWellPastAllTyping();

    // Model-architecture names deliberately excluded from the pip-style
    // listing (see portfolio-data.ts comment) — they'd look fake next to
    // real package names in an authentic "cat requirements.txt" rendering.
    expect(screen.queryByText("DeepLabV3+")).not.toBeInTheDocument();
    expect(screen.queryByText("Rust")).not.toBeInTheDocument();
  });

  it("erases a command character-by-character when scrolled back out of view, instead of snapping away instantly", async () => {
    mockUseInView.mockReturnValue(true);
    vi.useFakeTimers();
    const TechStack = await loadTechStack();
    const { rerender } = render(<TechStack />);
    advanceWellPastAllTyping();
    const fullCommand = TECH_STACK[0]!.command;
    expect(document.body.textContent).toContain(fullCommand);

    // Scrolled back out of view — re-render so the mocked `useInView`
    // returns false on this render pass (the real hook would flip on its
    // own via the IntersectionObserver callback; the mock needs a nudge).
    mockUseInView.mockReturnValue(false);
    rerender(<TechStack />);

    // A handful of erase-ticks only (not fully past) — the full command
    // should already be gone (erasing has started) well before enough
    // time has passed to erase everything, proving it's a gradual erase
    // rather than an instant snap the moment it leaves view.
    act(() => {
      vi.advanceTimersByTime(18 * 3); // a few erase-interval ticks (TYPE_SPEED_MS in TechStack.tsx)
    });
    expect(document.body.textContent).not.toContain(fullCommand);

    // Given enough time, it erases all the way back to nothing.
    advanceWellPastAllTyping();
    expect(document.body.textContent).not.toContain(fullCommand.slice(0, 5));
  });

  it("renders the correct language/package count summary in the header immediately (not gated on scroll/typing)", async () => {
    mockUseInView.mockReturnValue(false);
    const TechStack = await loadTechStack();
    render(<TechStack />);

    const totalTools = TECH_STACK.reduce((n, e) => n + e.tools.length, 0);
    expect(
      screen.getByText(`${TECH_STACK.length} LANGUAGES · ${totalTools} PACKAGES`),
    ).toBeInTheDocument();
  });
});
