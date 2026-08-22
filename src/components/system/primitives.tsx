import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Monospaced metadata line that clips in from a hairline. */
export function Meta({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
      whileInView={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn("label", className)}
    >
      {children}
    </motion.div>
  );
}

/** Headline that assembles per character with a mask reveal. */
export function CharReveal({
  text,
  className,
  delay = 0,
  step = 0.02,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });
  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden
          className="inline-block"
          initial={{ y: "0.4em", opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : { y: "0.4em", opacity: 0 }}
          transition={{ duration: 0.35, delay: delay + i * step, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Terminal-style sequential line output. */
export function TypeLines({
  lines,
  className,
  delay = 0,
  gap = 0.28,
  prefix = "›",
}: {
  lines: string[];
  className?: string;
  delay?: number;
  gap?: number;
  prefix?: string | null;
}) {
  return (
    <div className={cn("mono space-y-1 text-xs sm:text-sm", className)}>
      {lines.map((line, i) => (
        <motion.p
          key={line}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.35, delay: delay + i * gap }}
          className="flex gap-2 text-muted-foreground"
        >
          {prefix ? <span className="text-signal-dim">{prefix}</span> : null}
          <span>{line}</span>
        </motion.p>
      ))}
    </div>
  );
}

export function Hairline({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ transformOrigin: "left" }}
      className={cn("h-px w-full bg-border", className)}
    />
  );
}

export function SectionFrame({
  id,
  index,
  title,
  children,
  className,
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative w-full", className)}>
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-10">
        <div className="flex items-baseline justify-between gap-4 pt-24">
          <Meta>
            <span className="text-signal">{index}</span>
            <span className="px-2 text-border">/</span>
            {title}
          </Meta>
          <Meta delay={0.1}>∷</Meta>
        </div>
        <Hairline delay={0.05} className="mt-3" />
        {children}
      </div>
    </section>
  );
}
