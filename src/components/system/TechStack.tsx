import { useInView } from "motion/react";
import { useRef } from "react";
import { TECH_STACK } from "@/lib/portfolio-data";
import { Hairline, TypeLines } from "./primitives";
import { useTypewriter, Cursor } from "./use-typewriter";
import { TerminalWindow } from "./TerminalWindow";

/** Python=signal, JS/TS=amber, Java=signal-dim — reuses the site's existing
 * accent palette, no new colors introduced. */
const LANG_COLOR: Record<string, string> = {
  Python: "var(--color-signal)",
  "TypeScript/JavaScript": "var(--color-amber)",
  Java: "var(--color-signal-dim)",
};

const TYPE_SPEED_MS = 18;

function ManifestBlock({ entry }: { entry: (typeof TECH_STACK)[number] }) {
  // Each block runs its own command only once IT is scrolled into view —
  // not on a fixed timer, not chained to the previous block finishing.
  // Scrolling down the page is what "executes" each language in turn.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const command = useTypewriter(entry.command, TYPE_SPEED_MS, 150, inView);

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
          {inView && !command.done && <Cursor />}
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
