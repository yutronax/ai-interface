import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IDENTITY } from "@/lib/portfolio-data";

const BOOT = [
  "SYSTEM INITIALIZING",
  "→ IDENTITY",
  "→ DOMAIN",
  "→ CURRENT WORK",
  "→ SYSTEM STATUS",
];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const nameScale = useTransform(scrollYProgress, [0, 1], [1, 0.22]);
  const nameY = useTransform(scrollYProgress, [0, 1], ["0vh", "-32vh"]);
  const nameX = useTransform(scrollYProgress, [0, 1], ["0%", "-2%"]);
  const domainX = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const gridScale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const bootOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const seamScale = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => (s >= 6 ? s : s + 1)), 420);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div id="system" ref={ref} className="relative h-[220vh] w-full">
      <div className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden">
        <motion.div
          aria-hidden
          style={{ scale: gridScale, opacity: gridOpacity }}
          className="grid-field absolute inset-0"
        />
        <motion.div
          aria-hidden
          style={{ opacity: gridOpacity }}
          className="scan-line pointer-events-none absolute inset-0"
        />

        <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-5 pb-24 pt-6 sm:px-10 sm:pb-28 sm:pt-8">
          <motion.div style={{ opacity: bootOpacity }} className="mono space-y-1 text-[10px]">
            {BOOT.map((line, i) => (
              <div
                key={line}
                className="tracking-[0.22em] transition-opacity duration-500"
                style={{
                  opacity: step > i ? 1 : 0,
                  color: i === 0 ? "var(--color-signal)" : "var(--color-muted-foreground)",
                }}
              >
                {line}
              </div>
            ))}
          </motion.div>

          <div className="relative">
            <motion.h1
              style={{ scale: nameScale, y: nameY, x: nameX, transformOrigin: "left bottom" }}
              className="text-[13vw] font-semibold leading-[0.85] tracking-[-0.04em] sm:text-[11vw]"
            >
              <span
                className="block transition-[clip-path,opacity] duration-700"
                style={{
                  clipPath: step > 1 ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                }}
              >
                {IDENTITY.name}
              </span>
            </motion.h1>

            <motion.div
              style={{ x: domainX }}
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 sm:flex-nowrap"
            >
              <span
                className="mono whitespace-nowrap text-xs tracking-[0.3em] text-signal transition-opacity duration-700"
                style={{ opacity: step > 2 ? 1 : 0 }}
              >
                AI ENGINEER
              </span>
              {IDENTITY.domains.map((d, i) => (
                <span
                  key={d}
                  className="mono whitespace-nowrap text-xs tracking-[0.22em] text-muted-foreground transition-all duration-700"
                  style={{
                    opacity: step > 3 ? 1 : 0,
                    transform: step > 3 ? "none" : "translateX(24px)",
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <span className="pr-3 text-border">◇</span>
                  {d}
                </span>
              ))}
            </motion.div>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="space-y-1">
              {IDENTITY.status.map((s, i) => (
                <div
                  key={s}
                  className="mono text-[11px] tracking-[0.22em] transition-all duration-700"
                  style={{
                    opacity: step > 4 ? 1 : 0,
                    transform: step > 4 ? "none" : "translateY(10px)",
                    transitionDelay: `${i * 140}ms`,
                  }}
                >
                  <span className="pr-2 text-signal">[{String(i + 1).padStart(2, "0")}]</span>
                  {s}
                </div>
              ))}
            </div>
            <div
              className="mono text-right text-[10px] tracking-[0.22em] text-muted-foreground transition-opacity duration-700"
              style={{ opacity: step > 5 ? 1 : 0 }}
            >
              <div className="flex items-center justify-end gap-2 text-signal">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
                SYSTEM ONLINE
              </div>
              <div className="mt-1">SCROLL TO EXECUTE ⌁</div>
            </div>
          </div>
        </div>

        <motion.div
          aria-hidden
          style={{ scaleX: seamScale, transformOrigin: "left" }}
          className="absolute bottom-0 left-0 h-[2px] w-full bg-signal"
        />
      </div>
    </div>
  );
}
