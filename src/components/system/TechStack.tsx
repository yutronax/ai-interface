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

/** Roughly how long `useTypewriter` takes to finish a command line, so the
 * next block's command can start typing right after — one continuous
 * terminal session instead of every block appearing at once. */
const TYPE_SPEED_MS = 18;
function typingDurationMs(command: string) {
  return command.length * TYPE_SPEED_MS + 700;
}

function ManifestBlock({
  entry,
  startDelay,
}: {
  entry: (typeof TECH_STACK)[number];
  startDelay: number;
}) {
  // Always active from mount (like NavIndicator's command line) rather than
  // gated on scroll-into-view: these blocks sit well below the fold, so by
  // the time a visitor scrolls to them the typing has already settled —
  // it reads as an already-running terminal session, not a pop-in.
  const command = useTypewriter(entry.command, TYPE_SPEED_MS, startDelay, true);

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
      {command.done && (
        <TypeLines
          className="mt-3 pl-5"
          lines={entry.tools}
          prefix="·"
          gap={0.05}
        />
      )}
    </div>
  );
}

export function TechStack() {
  const totalTools = TECH_STACK.reduce((n, entry) => n + entry.tools.length, 0);

  let cumulativeDelay = 400;
  const startDelays = TECH_STACK.map((entry) => {
    const delay = cumulativeDelay;
    cumulativeDelay += typingDurationMs(entry.command) + 900;
    return delay;
  });

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
            {TECH_STACK.map((entry, i) => (
              <ManifestBlock key={entry.language} entry={entry} startDelay={startDelays[i]!} />
            ))}
          </div>
        </div>
      </TerminalWindow>
    </section>
  );
}
