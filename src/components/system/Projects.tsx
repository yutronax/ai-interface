import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { PROJECTS, type Project } from "@/lib/portfolio-data";
import { ProjectVisual } from "./ProjectVisual";

function Panel({ p }: { p: Project }) {
  return (
    <div className="flex h-[70vh] w-[86vw] shrink-0 flex-col justify-between border border-border bg-background p-6 sm:w-[62vw] sm:p-10 lg:w-[46vw]">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="label">
            PROJECT <span className="text-signal">{p.index}</span>
          </span>
          <span className="label">{p.kind.toUpperCase().replace("-", " ")}</span>
        </div>

        <motion.h3
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          whileInView={{ clipPath: "inset(0 0% 0 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="mono mt-5 text-2xl font-medium tracking-[-0.02em] sm:text-4xl"
        >
          {p.name}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-4 max-w-md text-sm text-muted-foreground"
        >
          {p.summary}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mono mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-signal"
        >
          {p.stack.map((s) => (
            <span key={s}>
              <span className="pr-1 text-border">[</span>
              {s}
              <span className="pl-1 text-border">]</span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="my-6 h-32 border border-border sm:h-40">
        <ProjectVisual kind={p.kind} />
      </div>

      <div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mono text-xs leading-relaxed text-muted-foreground"
        >
          <span className="text-signal-dim">/ / </span>
          {p.detail}
        </motion.p>
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer noopener"
          className="rule-link mono group mt-5 inline-block text-xs tracking-[0.22em] text-foreground"
        >
          {"<>"} OPEN ON GITHUB
          <span className="rule-link-under group-hover:origin-left group-hover:scale-x-100" />
        </a>
      </div>
    </div>
  );
}

export function Projects() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["2vw", "-232vw"]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div id="projects" ref={ref} className="relative h-[420vh] w-full">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto flex w-full max-w-[1400px] items-baseline justify-between px-5 sm:px-10">
          <span className="label">
            <span className="text-signal">03</span> / PROJECTS
          </span>
          <span className="label">HORIZONTAL TRANSPORT △</span>
        </div>
        <div className="mx-auto mt-3 h-px w-full max-w-[1400px] bg-border px-5 sm:px-10">
          <motion.div style={{ width: progress }} className="h-px bg-signal" />
        </div>

        <motion.div style={{ x }} className="mt-6 flex gap-6 pl-5 sm:pl-10">
          {PROJECTS.map((p) => (
            <Panel key={p.name} p={p} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
