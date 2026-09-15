import { motion } from "motion/react";
import { TECH_STACK } from "@/lib/portfolio-data";
import { Hairline } from "./primitives";
import { TerminalWindow } from "./TerminalWindow";

/** Same keys/colors as GitHubSection.tsx's LANG_COLOR — kept as a small,
 * independently-owned copy rather than a shared import: it's 3 lines, and
 * the two components already don't share other rendering concerns. */
const LANG_COLOR: Record<string, string> = {
  Python: "var(--color-signal)",
  TypeScript: "var(--color-amber)",
  Jupyter: "var(--color-signal-dim)",
};

function LanguageCard({
  language,
  tools,
  index,
}: {
  language: string;
  tools: string[];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.45, delay: index * 0.12 }}
      className="border border-border bg-background p-6 sm:p-8"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: LANG_COLOR[language] ?? "var(--color-border)" }}
        />
        <span className="mono text-xl font-medium tracking-[0.02em] sm:text-2xl">{language}</span>
      </div>
      <div className="label mt-2">{tools.length} TOOLS</div>
      <div className="mono mt-5 flex flex-wrap gap-2 text-xs">
        {tools.map((tool) => (
          <span
            key={tool}
            className="max-w-full break-words border border-border px-2.5 py-1 text-muted-foreground"
          >
            {tool}
          </span>
        ))}
      </div>
    </motion.div>
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
              {TECH_STACK.length} LANGUAGES · {totalTools} TOOLS
            </span>
          </div>
          <Hairline className="mt-3" />

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {TECH_STACK.map((entry, i) => (
              <LanguageCard
                key={entry.language}
                language={entry.language}
                tools={entry.tools}
                index={i}
              />
            ))}
          </div>
        </div>
      </TerminalWindow>
    </section>
  );
}
