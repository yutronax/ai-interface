import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TechStack } from "./TechStack";
import { TECH_STACK } from "@/lib/portfolio-data";

/**
 * Tests for tech-stack-kart-grid (Saga #392) — replaces the old single-root
 * ASCII tree ("Python" root with all tools underneath, which read as "only
 * Python is known") with a language-grouped card grid.
 */

describe("TechStack — language-grouped card grid (AC-1/AC-2/AC-3/AC-4/AC-5)", () => {
  it("AC-1: renders at least 2 distinct language cards (not a single Python root)", () => {
    render(<TechStack />);

    const languages = new Set(TECH_STACK.map((e) => e.language));
    expect(languages.size).toBeGreaterThanOrEqual(2);
    for (const language of languages) {
      expect(screen.getByText(language)).toBeInTheDocument();
    }
  });

  it("AC-1: TypeScript is rendered as its own card, distinct from Python", () => {
    render(<TechStack />);

    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("AC-2: each card renders its own tools as separate chips", () => {
    render(<TechStack />);

    const pythonEntry = TECH_STACK.find((e) => e.language === "Python")!;
    const typescriptEntry = TECH_STACK.find((e) => e.language === "TypeScript")!;

    for (const tool of pythonEntry.tools) {
      expect(screen.getByText(tool)).toBeInTheDocument();
    }
    for (const tool of typescriptEntry.tools) {
      expect(screen.getByText(tool)).toBeInTheDocument();
    }
  });

  it("AC-3: no tool renders that isn't present in TECH_STACK's own data (no invented technologies)", () => {
    render(<TechStack />);

    const allExpectedTools = new Set(TECH_STACK.flatMap((e) => e.tools));
    // Sample assertion: a tool that was never in TECH_STACK must not appear
    // as a chip (guards against silently reintroducing invented tech).
    expect(allExpectedTools.has("Rust")).toBe(false);
    expect(screen.queryByText("Rust")).not.toBeInTheDocument();
  });

  it("AC-4: a language card renders correctly even with a short tools list (does not look empty/broken)", () => {
    render(<TechStack />);

    const typescriptEntry = TECH_STACK.find((e) => e.language === "TypeScript")!;
    const card = screen.getByText("TypeScript").closest("div");
    expect(card).toBeInTheDocument();
    // The card's tool count label reflects the real (possibly short) list —
    // not hidden or replaced with a placeholder.
    expect(screen.getByText(`${typescriptEntry.tools.length} TOOLS`)).toBeInTheDocument();
  });

  it("AC-5: long tool name chips carry wrap/break classes so they can't overflow the card", () => {
    render(<TechStack />);

    const longToolChip = screen.getByText("DeepLabV3+");
    expect(longToolChip.className).toContain("break-words");
    expect(longToolChip.className).toContain("max-w-full");
  });

  it("renders the correct language/tool count summary in the header", () => {
    render(<TechStack />);

    const totalTools = TECH_STACK.reduce((n, e) => n + e.tools.length, 0);
    expect(
      screen.getByText(`${TECH_STACK.length} LANGUAGES · ${totalTools} TOOLS`),
    ).toBeInTheDocument();
  });
});
