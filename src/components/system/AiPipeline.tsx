import {
  motion,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import { useSectionProgress } from "./use-section-progress";
import { useRef, useState, useEffect } from "react";
import { PIPELINE } from "@/lib/portfolio-data";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const STAGE_STARTS = PIPELINE.map((_, i) => 0.12 + i * 0.28);

type StageStyle = {
  bodyOpacity: MotionValue<number>;
  bodyY: MotionValue<number>;
};

function Stage({
  stage,
  i,
  style,
  active,
  onHover,
  expanded,
  onToggle,
}: {
  stage: (typeof PIPELINE)[number];
  i: number;
  style: StageStyle;
  active: boolean;
  onHover: (i: number | null) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const hasContent = !!stage.exampleContent;

  return (
    <div
      className="relative flex-1"
      onMouseEnter={() => onHover(i)}
      onMouseLeave={() => onHover(null)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* node marker */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center border transition-all duration-500",
            active ? "border-signal bg-signal/10" : "border-border bg-background",
          )}
        >
          <span
            className={cn(
              "mono text-[10px] tracking-widest transition-colors duration-500",
              active ? "text-signal" : "text-muted-foreground",
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
        </span>
        <span
          className={cn(
            "mono text-sm tracking-[0.3em] transition-colors duration-500",
            active ? "text-signal" : "text-muted-foreground",
          )}
        >
          {stage.stage}
        </span>
        {hasContent && (
          <ChevronDown
            size={16}
            data-testid="expand-chevron"
            className={cn(
              "transition-transform duration-300",
              expanded ? "rotate-180" : "rotate-0",
            )}
          />
        )}
      </div>

      <motion.div style={{ opacity: style.bodyOpacity, y: style.bodyY }} className="mt-6">
        <div
          className={cn(
            "text-3xl font-semibold tracking-[-0.03em] transition-colors duration-500 sm:text-4xl",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {stage.tool}
        </div>
        <p className="mono mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
          <span className="text-signal-dim">/ / </span>
          {stage.body}
        </p>
        <div
          className={cn(
            "mono mt-4 inline-block border px-2 py-1 text-[10px] tracking-[0.22em] transition-all duration-500",
            active ? "border-signal text-signal" : "border-border text-muted-foreground",
          )}
        >
          {active ? "ACTIVE" : "STANDBY"}
        </div>

        {/* Expanded content */}
        <AnimatePresence mode="wait">
          {expanded && hasContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.3,
                ease: "easeInOut",
              }}
              className="overflow-hidden"
            >
              <div className="mono mt-4 space-y-2">
                <div className="text-xs font-semibold text-signal">
                  {stage.exampleContent.label}
                </div>
                <div className="bg-background/50 border border-border rounded px-3 py-2 text-[11px] leading-relaxed text-foreground/80 overflow-x-auto max-h-48">
                  <code>{stage.exampleContent.code}</code>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function AiPipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollYProgress = useSectionProgress(ref, "pin");
  const [scrollStage, setScrollStage] = useState(-1);
  const [hovered, setHovered] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let s = -1;
    STAGE_STARTS.forEach((start, i) => {
      if (v >= start) s = i;
    });
    setScrollStage(s);
  });

  // Close expanded card on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpandedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close expanded card on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target instanceof Element) {
        const closestStage = e.target.closest("div[role='button']");
        if (!closestStage) {
          setExpandedIndex(null);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleStageToggle = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  const seg1 = useTransform(scrollYProgress, [0.12, 0.4], ["0%", "100%"]);
  const seg2 = useTransform(scrollYProgress, [0.4, 0.68], ["0%", "100%"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.08], [0, 1]);

  // Parent-computed transforms: child-level useTransform on a passed
  // MotionValue freezes mid-flight in this stack.
  const stageStyles = PIPELINE.map((_, i): StageStyle => {
    const start = STAGE_STARTS[i]!;
    return {
      bodyOpacity: useTransform(scrollYProgress, [start, start + 0.14], [0, 1]),
      bodyY: useTransform(scrollYProgress, [start, start + 0.16], [26, 0]),
    };
  });

  return (
    <div id="pipeline" ref={ref} className="relative h-[220vh] w-full">
      <div ref={containerRef} className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-10">
          <motion.div
            style={{ opacity: headerOpacity }}
            className="flex items-baseline justify-between"
          >
            <span className="label">
              <span className="text-signal">05</span> / AI-NATIVE PIPELINE
            </span>
            <span className="label">PLAN → BUILD → VERIFY</span>
          </motion.div>
          <motion.div style={{ opacity: headerOpacity }} className="mt-3 h-px w-full bg-border" />

          <div className="relative mt-16 sm:mt-20">
            {/* connector line */}
            <div aria-hidden className="absolute left-0 right-0 top-[18px] hidden md:block">
              <div className="h-px w-full bg-border" />
              <div className="absolute inset-y-0 left-0 flex w-full">
                <motion.div style={{ width: seg1 }} className="h-px bg-signal" />
                <motion.div style={{ width: seg2 }} className="h-px bg-signal" />
              </div>
            </div>

            <div className="flex flex-col gap-14 md:flex-row md:gap-8">
              {PIPELINE.map((s, i) => (
                <Stage
                  key={s.stage}
                  stage={s}
                  i={i}
                  style={stageStyles[i]!}
                  active={i <= scrollStage || hovered === i}
                  onHover={setHovered}
                  expanded={expandedIndex === i}
                  onToggle={() => handleStageToggle(i)}
                />
              ))}
            </div>
          </div>

          <motion.div
            style={{ opacity: headerOpacity }}
            className="mono mt-16 text-[11px] tracking-[0.22em] text-muted-foreground"
          >
            <span className="text-signal-dim">/ / </span>
            SPECIFICATION BEFORE CODE. VERIFICATION AFTER.
          </motion.div>
        </div>
      </div>
    </div>
  );
}
