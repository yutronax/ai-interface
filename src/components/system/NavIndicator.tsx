import { useEffect, useState } from "react";
import { SECTIONS } from "@/lib/portfolio-data";
import { useTypewriter, Cursor } from "./use-typewriter";

const HISTORY = SECTIONS.map((s) => ({
  id: s.id,
  label: s.label,
  cmd: `grep -ri "${s.label.toLowerCase()}" ./system`,
}));

export function NavIndicator() {
  const [active, setActive] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Full panel is ~115px tall and near-full-width on a 375px screen, and it
  // sits fixed above the last section's content (e.g. Projects' "OPEN ON
  // GITHUB" links) — on mobile it starts collapsed to a small badge so it
  // doesn't cover other tap targets; desktop keeps it always expanded.
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setExpanded(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter((n): n is HTMLElement =>
      Boolean(n),
    );
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = SECTIONS.findIndex((s) => s.id === visible.target.id);
        if (idx >= 0) {
          setActive(idx);
          setHistoryIndex(idx);
        }
      },
      { threshold: [0.15, 0.4, 0.75], rootMargin: "-20% 0px -40% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const entry = HISTORY[historyIndex]!;
  const command = useTypewriter(entry.cmd, 22, 80, true);

  function cycle(delta: number) {
    setError(null);
    setHistoryIndex((i) => Math.min(HISTORY.length - 1, Math.max(0, i + delta)));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      cycle(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      cycle(1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim().length === 0) {
        window.location.hash = entry.id;
        return;
      }
      setError(`grep: "${inputValue}": pattern not found — use ↑ / ↓ to browse matches`);
      setInputValue("");
    }
  }

  if (!expanded) {
    return (
      <nav
        aria-label="Section navigator (terminal)"
        className="fixed bottom-5 right-5 z-50 select-none"
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={`Open section navigator (currently ${entry.label})`}
          className="hair tap-target mono flex h-10 min-w-10 items-center justify-center bg-background/90 px-2 text-[10px] tracking-[0.18em] text-signal backdrop-blur-[2px]"
        >
          {String(active + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Section navigator (terminal)"
      className="fixed bottom-5 right-5 z-50 select-none sm:bottom-8 sm:right-8"
    >
      <div className="hair w-[min(78vw,300px)] bg-background/90 px-3 py-2.5 backdrop-blur-[2px]">
        <div className="flex items-center justify-between">
          <div className="mono text-[10px] tracking-[0.18em] text-signal">
            {String(active + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Collapse section navigator"
            className="tap-target mono text-[10px] text-muted-foreground sm:hidden"
          >
            ×
          </button>
        </div>

        <a
          href={`#${entry.id}`}
          className="tap-target mono mt-1.5 block truncate text-[11px] tracking-[0.05em] text-foreground"
          aria-label={`Go to ${entry.label}`}
        >
          <span className="text-muted-foreground">$ </span>
          {command.typed}
          {!command.done && <Cursor />}
        </a>
        <div
          className="mono mt-0.5 text-[10px] tracking-[0.1em] text-signal transition-opacity duration-300"
          style={{ opacity: command.done ? 1 : 0 }}
        >
          → #{entry.id} <span className="text-muted-foreground">({entry.label})</span>
        </div>

        <div className="mono mt-2 flex items-center gap-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
          <span className="text-signal">$</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="↑ / ↓ history, ↵ go"
            aria-label="Terminal command (history navigation only)"
            className="mono w-full bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        {error && (
          <div className="mono mt-1 text-[10px] tracking-[0.05em] text-signal">{error}</div>
        )}
      </div>
    </nav>
  );
}
