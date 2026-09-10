import { motion, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IDENTITY } from "@/lib/portfolio-data";
import { useSectionProgress } from "./use-section-progress";
import { useTypewriter, Cursor } from "./use-typewriter";
import { TerminalWindow } from "./TerminalWindow";

const COMMAND = "whoami --verbose";

const BOOT = ["SYSTEM INITIALIZING", "→ IDENTITY", "→ DOMAIN", "→ CURRENT WORK", "→ SYSTEM STATUS"];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollYProgress = useSectionProgress(ref, "pin");

  const nameScale = useTransform(scrollYProgress, [0, 1], [1, 0.22]);
  const nameY = useTransform(scrollYProgress, [0, 1], ["0vh", "-32vh"]);
  const nameX = useTransform(scrollYProgress, [0, 1], ["0%", "-2%"]);
  const domainX = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const gridScale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const bootOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const seamScale = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  // Command line types out first, like invoking a real terminal command.
  const command = useTypewriter(COMMAND, 45, 300, true);

  // Once the command finishes "executing", its output streams in line by line.
  const [bootLineCount, setBootLineCount] = useState(0);
  useEffect(() => {
    if (!command.done) return;
    const t = window.setInterval(() => {
      setBootLineCount((c) => {
        if (c >= BOOT.length) {
          window.clearInterval(t);
          return c;
        }
        return c + 1;
      });
    }, 160);
    return () => window.clearInterval(t);
  }, [command.done]);

  const bootDone = bootLineCount >= BOOT.length;

  // Identity name types out once boot output has finished printing.
  const name = useTypewriter(IDENTITY.name, 55, 250, bootDone);

  // step drives the remaining (still-fading) UI below the name.
  const step = name.done ? 6 : 0;

  return (
    <div id="system" ref={ref} className="relative h-[220vh] w-full">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden p-3 sm:p-6">
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

        <TerminalWindow title="yusuf@system — zsh" className="h-full w-full max-w-[1400px]">
          <div className="relative mx-auto flex h-full w-full flex-col justify-between overflow-hidden px-5 pb-6 pt-5 sm:px-10 sm:pb-10 sm:pt-8">
            <motion.div
              style={{ opacity: bootOpacity }}
              className="mono space-y-1 text-[10px] sm:text-xs"
            >
              <div className="tracking-[0.22em] text-signal">
                <span className="text-muted-foreground">$ </span>
                {command.typed}
                {!command.done && <Cursor />}
              </div>
              {BOOT.map((line, i) => (
                <div
                  key={line}
                  className="tracking-[0.22em]"
                  style={{
                    visibility: bootLineCount > i ? "visible" : "hidden",
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
                className="text-[11vw] font-semibold leading-[0.85] tracking-[-0.04em] sm:text-[9vw]"
              >
                <span className="block">
                  {name.typed}
                  {!name.done && bootDone && <Cursor />}
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
                    <span className="pr-3 text-muted-foreground">◇</span>
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
        </TerminalWindow>
      </div>
    </div>
  );
}
