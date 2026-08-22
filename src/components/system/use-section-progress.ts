import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect, type RefObject } from "react";

/**
 * Scroll progress measured from live layout every frame.
 *
 * motion's useScroll caches target geometry at mount; webfont swaps and
 * late layout shifts silently corrupt every pinned section below the fold.
 * Measuring getBoundingClientRect per scroll frame is immune to that.
 *
 * mode "pin":   0 when the section top reaches the viewport top,
 *               1 when the section bottom reaches the viewport bottom
 *               (equivalent to offset ["start start", "end end"]).
 * mode "enter": 0 when the section top reaches the viewport bottom,
 *               1 when the section bottom reaches the viewport bottom
 *               (equivalent to offset ["start end", "end end"]).
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  mode: "pin" | "enter" = "pin",
): MotionValue<number> {
  const progress = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw =
        mode === "pin"
          ? -rect.top / Math.max(1, rect.height - vh)
          : (vh - rect.top) / Math.max(1, rect.height);
      progress.set(Math.min(1, Math.max(0, raw)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, mode, progress]);

  return progress;
}
