import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { IDENTITY } from "@/lib/portfolio-data";
import { CharReveal, Hairline, Meta, TypeLines } from "./primitives";

const STATEMENT = ["BUILD", "SYSTEMS", "THAT", "ACT."];

export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const seamScale = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const statusOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);

  return (
    <footer id="final" ref={ref} className="relative w-full">
      <motion.div
        aria-hidden
        style={{ scaleX: seamScale, transformOrigin: "left" }}
        className="h-[2px] w-full bg-signal"
      />
      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-10">
        <div aria-hidden className="grid-field pointer-events-none absolute inset-0 opacity-20" />

        <div className="relative flex items-baseline justify-between pt-24">
          <Meta>
            <span className="text-signal">07</span> / FINAL STATE
          </Meta>
          <Meta delay={0.1}>SYSTEM CONVERGED ◍</Meta>
        </div>
        <Hairline className="mt-3" />

        {/* oversized statement */}
        <h2 className="mt-16 text-[15vw] font-semibold leading-[0.85] tracking-[-0.045em] sm:text-[11vw]">
          {STATEMENT.map((word, i) => (
            <span key={word} className="block overflow-hidden">
              <CharReveal
                text={word}
                delay={i * 0.12}
                step={0.035}
                {...(i === STATEMENT.length - 1 ? { className: "text-signal" } : {})}
              />
            </span>
          ))}
        </h2>

        {/* converged system readout */}
        <motion.div style={{ opacity: statusOpacity }} className="mt-20 grid gap-10 pb-10 sm:grid-cols-3">
          <div>
            <div className="label">SYSTEM STATUS</div>
            <div className="mono mt-3 flex items-center gap-2 text-sm text-signal">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              ONLINE
            </div>
          </div>
          <div>
            <div className="label">OPERATOR</div>
            <div className="mt-3 text-xl font-medium tracking-[-0.02em]">{IDENTITY.name}</div>
            <div className="mono mt-1 text-xs text-muted-foreground">{IDENTITY.role}</div>
          </div>
          <div>
            <div className="label">ACTIVE DOMAINS</div>
            <TypeLines
              className="mt-3"
              lines={IDENTITY.domains}
              prefix={null}
              gap={0.15}
            />
          </div>
        </motion.div>

        <Hairline />

        <div className="relative flex flex-wrap items-center justify-between gap-6 py-8">
          <div className="mono text-[10px] tracking-[0.22em] text-muted-foreground">
            © {new Date().getFullYear()} {IDENTITY.name} · INTERFACE v1.0
          </div>
          <div className="flex gap-8">
            <a
              href={IDENTITY.github}
              target="_blank"
              rel="noreferrer noopener"
              className="rule-link group mono text-[11px] tracking-[0.22em] text-foreground"
            >
              {"<>"} GITHUB
              <span className="rule-link-under group-hover:origin-left group-hover:scale-x-100" />
            </a>
            <a
              href={IDENTITY.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              className="rule-link group mono text-[11px] tracking-[0.22em] text-foreground"
            >
              [in] LINKEDIN
              <span className="rule-link-under group-hover:origin-left group-hover:scale-x-100" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
