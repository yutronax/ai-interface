import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EXPERIENCES, type Experience as Exp } from "@/lib/portfolio-data";
import { Hairline, Meta } from "./primitives";
import { SatelliteViz } from "./SatelliteViz";

function Counter({ value }: { value: string }) {
  const num = Number(value.replace(/[^\d.]/g, ""));
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(Number.isFinite(num) && num > 0 ? "0" : value);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });

  useMotionValueEvent(spring, "change", (v) => {
    if (!Number.isFinite(num) || num <= 0) return;
    setDisplay(value.replace(/[\d.,]+/, Math.round(v).toLocaleString("en-US")));
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !Number.isFinite(num) || num <= 0) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          mv.set(num);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mv, num]);

  return <span ref={ref}>{display}</span>;
}

function ExecutionBlock({ exp, i }: { exp: Exp; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 40%"] });
  const barWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <article ref={ref} className="relative py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
          <motion.span
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="inline-block"
          >
            {exp.org}
          </motion.span>
        </h3>
        <Meta className="text-right">
          {exp.period}
          <span className="px-2 text-border">/</span>
          <span className="text-signal">{exp.state}</span>
        </Meta>
      </div>

      <div className="mt-4 h-px w-full bg-border">
        <motion.div style={{ width: barWidth }} className="h-px bg-signal" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <dl className="space-y-0">
          {exp.rows.map((r, k) => (
            <motion.div
              key={r.key}
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: 0.15 + k * 0.14 }}
              className="grid grid-cols-[6rem_1fr] gap-4 border-t border-border py-3 sm:grid-cols-[8rem_1fr]"
            >
              <dt className="label pt-1">{r.key}</dt>
              <dd className="mono text-sm text-foreground">{r.value}</dd>
            </motion.div>
          ))}
        </dl>

        <div>
          {exp.metrics && exp.id === "mavi" ? (
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {exp.metrics.map((m, k) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.5, delay: 0.2 + k * 0.15 }}
                  className="bg-background p-5"
                >
                  <div className="text-3xl font-semibold tracking-[-0.03em] text-signal sm:text-4xl">
                    <Counter value={m.value} />
                    {m.unit}
                  </div>
                  <div className="label mt-2">{m.label}</div>
                </motion.div>
              ))}
            </div>
          ) : null}

          {exp.id === "tubitak" ? <SatelliteViz /> : null}

          {exp.id === "obss" ? (
            <div className="hair relative overflow-hidden p-6">
              <div className="label">EXECUTION TRACE</div>
              <div className="mono mt-4 space-y-2 text-xs text-muted-foreground">
                {[
                  "spec → decomposition → acceptance criteria",
                  "agent build loop · in-editor context",
                  "red-team pass · adversarial review",
                  "test-first verification · regression sweep",
                ].map((l, k) => (
                  <motion.div
                    key={l}
                    initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                    whileInView={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + k * 0.2 }}
                    className="flex gap-3"
                  >
                    <span className="text-signal">{String(k + 1).padStart(2, "0")}</span>
                    <span>{l}</span>
                  </motion.div>
                ))}
              </div>
              <div
                aria-hidden
                className="grid-field pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-20"
              />
            </div>
          ) : null}
        </div>
      </div>
      {i < EXPERIENCES.length - 1 ? <Hairline className="mt-16" /> : null}
    </article>
  );
}

export function Experience() {
  return (
    <section id="experience" className="relative w-full">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-10">
        <div className="flex items-baseline justify-between pt-28">
          <Meta>
            <span className="text-signal">02</span> / EXPERIENCE
          </Meta>
          <Meta delay={0.1}>{EXPERIENCES.length} PROCESSES</Meta>
        </div>
        <Hairline className="mt-3" />
        {EXPERIENCES.map((e, i) => (
          <ExecutionBlock key={e.id} exp={e} i={i} />
        ))}
      </div>
    </section>
  );
}
