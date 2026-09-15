import { useEffect, useState } from "react";
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
/** Pause after a command's output finishes before the next one starts
 * typing — a real shell doesn't chain commands with zero gap. */
const PAUSE_BETWEEN_MS = 550;

function ManifestBlock({
  entry,
  active,
  onDone,
}: {
  entry: (typeof TECH_STACK)[number];
  active: boolean;
  onDone: () => void;
}) {
  // A block doesn't even start typing until the previous one has fully
  // finished (see TechStack's revealedCount) — only one command is ever
  // "running" at a time, like an actual terminal executing a script
  // top-to-bottom rather than three commands appearing at once.
  const command = useTypewriter(entry.command, TYPE_SPEED_MS, 250, active);

  useEffect(() => {
    if (!command.done) return;
    const t = window.setTimeout(onDone, PAUSE_BETWEEN_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is caps at TECH_STACK.length by the parent, re-invoking it is harmless
  }, [command.done]);

  return (
    <div>
      <div className="mono flex items-center gap-2 text-sm sm:text-base">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: LANG_COLOR[entry.language] ?? "var(--color-border)" }}
        />
        <span className="text-signal">$</span>
        <span className="text-foreground">
          {command.typed}
          {!command.done && <Cursor />}
        </span>
      </div>
      {command.done && <TypeLines className="mt-3 pl-5" lines={entry.tools} prefix="·" gap={0.05} />}
    </div>
  );
}

export function TechStack() {
  const totalTools = TECH_STACK.reduce((n, entry) => n + entry.tools.length, 0);
  // How many blocks exist in the DOM yet — grows one at a time as each
  // finishes, instead of all 3 being pre-scheduled with fixed delays.
  const [revealedCount, setRevealedCount] = useState(1);
  const allDone = revealedCount >= TECH_STACK.length;

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

          <div className="mt-10 space-y-10">
            {TECH_STACK.slice(0, revealedCount).map((entry, i) => (
              <ManifestBlock
                key={entry.language}
                entry={entry}
                active={i === revealedCount - 1}
                onDone={() => setRevealedCount((c) => Math.min(TECH_STACK.length, c + 1))}
              />
            ))}
            {/* idle prompt once the whole "script" has finished running */}
            {allDone && (
              <div className="mono flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
                <span className="text-signal">$</span>
                <Cursor />
              </div>
            )}
          </div>
        </div>
      </TerminalWindow>
    </section>
  );
}
