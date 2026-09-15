import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { TECH_STACK } from "@/lib/portfolio-data";
import { Hairline, TypeLines } from "./primitives";
import { Cursor } from "./use-typewriter";
import { TerminalWindow } from "./TerminalWindow";

/** Python=signal, JS/TS=amber, Java=signal-dim — reuses the site's existing
 * accent palette, no new colors introduced. */
const LANG_COLOR: Record<string, string> = {
  Python: "var(--color-signal)",
  "TypeScript/JavaScript": "var(--color-amber)",
  Java: "var(--color-signal-dim)",
};

const TYPE_SPEED_MS = 18;

/**
 * Like `useTypewriter`, but symmetrical: scrolling a block out of view
 * erases it character-by-character (not just an instant snap), and
 * scrolling back in retypes from wherever it left off — the shared
 * `useTypewriter` (NavIndicator/Hero) only ever types forward once, so this
 * is a separate hook rather than a shared-behavior change.
 */
function useReversibleTypewriter(text: string, active: boolean) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const id = window.setInterval(() => {
      setTyped((current) => {
        if (active) {
          return current.length < text.length ? text.slice(0, current.length + 1) : current;
        }
        return current.length > 0 ? text.slice(0, current.length - 1) : current;
      });
    }, TYPE_SPEED_MS);
    return () => window.clearInterval(id);
  }, [active, text]);

  return { typed, done: typed.length === text.length };
}

function ManifestBlock({ entry }: { entry: (typeof TECH_STACK)[number] }) {
  // Each block runs its own command while IT is scrolled into view, and
  // reverses (erases) when scrolled back out — no `once`, so it's fully
  // tied to scroll position in both directions.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const command = useReversibleTypewriter(entry.command, inView);

  return (
    <div ref={ref}>
      <div className="mono flex items-center gap-2 text-sm sm:text-base">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: LANG_COLOR[entry.language] ?? "var(--color-border)" }}
        />
        <span className="text-signal">$</span>
        <span className="text-foreground">
          {command.typed}
          {(command.typed.length > 0 || inView) && !command.done && <Cursor />}
        </span>
      </div>
      {command.done && <TypeLines className="mt-3 pl-5" lines={entry.tools} prefix="·" gap={0.05} />}
    </div>
  );
}

export function TechStack() {
  const totalTools = TECH_STACK.reduce((n, entry) => n + entry.tools.length, 0);

  return (
    <section id="stack" className="relative w-full px-3 pt-28 sm:px-6">
      <TerminalWindow title="yusuf@system — stack" className="mx-auto w-full max-w-[1400px]">
        <div className="px-5 py-6 sm:px-10 sm:py-8">
          <div className="flex items-baseline justify-between">
            <span className="label">
              <span className="text-signal">04</span> / TECH STACK
            </span>
            <span className="label">
              {TECH_STACK.length} LANGUAGES · {totalTools} PACKAGES
            </span>
          </div>
          <Hairline className="mt-3" />

          <div className="mt-10 space-y-16">
            {TECH_STACK.map((entry) => (
              <ManifestBlock key={entry.language} entry={entry} />
            ))}
          </div>
        </div>
      </TerminalWindow>
    </section>
  );
}
