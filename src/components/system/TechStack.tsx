import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { TECH_GRAPH } from "@/lib/portfolio-data";
import { cn } from "@/lib/utils";

type BranchStyle = {
  lineScale: MotionValue<number>;
  bodyOpacity: MotionValue<number>;
  bodyX: MotionValue<number>;
};

function Branch({
  child,
  style,
  active,
  onSelect,
}: {
  child: { name: string; leaves: string[] };
  style: BranchStyle;
  active: boolean;
  onSelect: (name: string | null) => void;
}) {
  return (
    <div
      className="relative flex items-start gap-0"
      onMouseEnter={() => onSelect(child.name)}
      onMouseLeave={() => onSelect(null)}
    >
      {/* connector */}
      <div className="mt-5 flex w-10 items-center sm:w-16">
        <motion.span
          style={{ scaleX: style.lineScale, transformOrigin: "left" }}
          className={cn(
            "h-px w-full transition-colors duration-300",
            active ? "bg-signal" : "bg-border",
          )}
        />
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rotate-45 border transition-colors duration-300",
            active ? "border-signal bg-signal" : "border-border bg-background",
          )}
        />
      </div>

      <motion.div
        style={{ opacity: style.bodyOpacity, x: style.bodyX }}
        className="min-w-0 flex-1"
      >
        <div
          className={cn(
            "mono text-xl font-medium tracking-[0.06em] transition-colors duration-300 sm:text-2xl",
            active ? "text-signal" : "text-foreground",
          )}
        >
          {child.name}
        </div>
        <div className="mono mt-2 space-y-0.5 text-[11px] sm:text-xs">
          {child.leaves.map((leaf, k) => (
            <motion.div
              key={leaf}
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.4, delay: 0.2 + k * 0.12 }}
              className={cn(
                "flex gap-2 transition-colors duration-300",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className={active ? "text-signal-dim" : "text-border"}>
                {k === child.leaves.length - 1 ? "└──" : "├──"}
              </span>
              <span>{leaf}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function TechStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [selected, setSelected] = useState<string | null>(null);

  const rootScale = useTransform(scrollYProgress, [0, 0.12], [0.85, 1]);
  const rootOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const trunkScale = useTransform(scrollYProgress, [0.08, 0.75], [0, 1]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.06], [0, 1]);

  // Parent-computed transforms: child-level useTransform on a passed
  // MotionValue freezes mid-flight in this stack.
  const branchStyles = TECH_GRAPH.children.map((_, i): BranchStyle => {
    const start = 0.12 + i * 0.16;
    return {
      lineScale: useTransform(scrollYProgress, [start, start + 0.1], [0, 1]),
      bodyOpacity: useTransform(scrollYProgress, [start + 0.04, start + 0.12], [0, 1]),
      bodyX: useTransform(scrollYProgress, [start + 0.04, start + 0.14], [-24, 0]),
    };
  });

  const leafCount = TECH_GRAPH.children.reduce((n, c) => n + c.leaves.length, 0);

  return (
    <div id="stack" ref={ref} className="relative h-[260vh] w-full">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-10">
          <motion.div style={{ opacity: headerOpacity }} className="flex items-baseline justify-between">
            <span className="label">
              <span className="text-signal">04</span> / TECH STACK
            </span>
            <span className="label">
              {selected ? `FOCUS ⌁ ${selected.toUpperCase()}` : "DEPENDENCY GRAPH"}
            </span>
          </motion.div>
          <motion.div style={{ opacity: headerOpacity }} className="mt-3 h-px w-full bg-border" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            {/* root node */}
            <div className="relative">
              <motion.div style={{ scale: rootScale, opacity: rootOpacity, transformOrigin: "left center" }}>
                <div className="label">ROOT RUNTIME</div>
                <div className="mt-3 text-6xl font-semibold tracking-[-0.04em] sm:text-7xl lg:text-8xl">
                  {TECH_GRAPH.root}
                </div>
                <div className="mono mt-4 text-[11px] tracking-[0.22em] text-muted-foreground">
                  [{TECH_GRAPH.children.length} MODULES · {leafCount} CAPABILITIES]
                </div>
              </motion.div>
              {/* trunk */}
              <motion.span
                aria-hidden
                style={{ scaleY: trunkScale, transformOrigin: "top" }}
                className="absolute left-full top-6 hidden h-[80%] w-px bg-border lg:block"
              />
            </div>

            {/* branches */}
            <div className="space-y-8">
              {TECH_GRAPH.children.map((c, i) => (
                <Branch
                  key={c.name}
                  child={c}
                  style={branchStyles[i]!}
                  active={selected === c.name}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
