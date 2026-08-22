import { useEffect, useState } from "react";
import { SECTIONS } from "@/lib/portfolio-data";

export function NavIndicator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (n): n is HTMLElement => Boolean(n),
    );
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = SECTIONS.findIndex((s) => s.id === visible.target.id);
        if (idx >= 0) setActive(idx);
      },
      { threshold: [0.15, 0.4, 0.75], rootMargin: "-20% 0px -40% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const current = SECTIONS[active];

  return (
    <nav
      aria-label="Section indicator"
      className="pointer-events-none fixed bottom-5 right-5 z-50 select-none sm:bottom-8 sm:right-8"
    >
      <div className="pointer-events-auto hair bg-background/80 px-3 py-2 backdrop-blur-[2px]">
        <div className="mono text-[10px] tracking-[0.22em] text-signal">
          {String(active + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
        </div>
        <div className="mono mt-0.5 text-[10px] tracking-[0.22em] text-foreground">
          {current?.label}
        </div>
        <div className="mt-2 flex gap-1">
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-label={s.label}
              className="h-3 w-3 py-1"
              style={{ display: "block" }}
            >
              <span
                className="block h-px w-3 transition-colors duration-300"
                style={{
                  backgroundColor: i <= active ? "var(--color-signal)" : "var(--color-border)",
                }}
              />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
