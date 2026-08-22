import { motion } from "motion/react";
import { IDENTITY, REPOS } from "@/lib/portfolio-data";
import { Hairline, Meta } from "./primitives";

const LANG_COLOR: Record<string, string> = {
  Python: "var(--color-signal)",
  TypeScript: "var(--color-amber)",
  Jupyter: "var(--color-signal-dim)",
};

export function GitHubSection() {
  const totalStars = REPOS.reduce((n, r) => n + r.stars, 0);

  return (
    <section id="github" className="relative w-full">
      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-10">
        <div className="flex items-baseline justify-between pt-28">
          <Meta>
            <span className="text-signal">06</span> / GITHUB
          </Meta>
          <Meta delay={0.1}>DEVELOPER DASHBOARD</Meta>
        </div>
        <Hairline className="mt-3" />

        {/* dashboard summary strip */}
        <div className="mt-10 grid gap-px bg-border sm:grid-cols-3">
          {[
            { k: "PUBLIC REPOS", v: String(REPOS.length).padStart(2, "0") },
            { k: "TOTAL STARS", v: String(totalStars) },
            { k: "PRIMARY LANG", v: "Python" },
          ].map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="bg-background p-5"
            >
              <div className="text-2xl font-semibold tracking-[-0.02em] text-signal sm:text-3xl">
                {s.v}
              </div>
              <div className="label mt-2">{s.k}</div>
            </motion.div>
          ))}
        </div>

        {/* repo rows */}
        <div className="mt-14">
          <div className="label mb-4 grid grid-cols-[1fr_auto] gap-4 sm:grid-cols-[2rem_1.4fr_1fr_0.6fr_0.8fr_0.8fr]">
            <span className="hidden sm:block">∷</span>
            <span>REPOSITORY</span>
            <span className="hidden sm:block">STACK</span>
            <span className="hidden sm:block">LANG</span>
            <span className="hidden text-right sm:block">STARS</span>
            <span className="text-right">ACTIVITY</span>
          </div>
          <Hairline />
          {REPOS.map((r, i) => (
            <motion.a
              key={r.name}
              href={IDENTITY.github}
              target="_blank"
              rel="noreferrer noopener"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-4 transition-colors duration-300 hover:bg-surface sm:grid-cols-[2rem_1.4fr_1fr_0.6fr_0.8fr_0.8fr]"
            >
              <span className="mono hidden text-[11px] text-border group-hover:text-signal sm:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mono text-sm text-foreground transition-colors duration-300 group-hover:text-signal">
                {r.name}
                <span className="ml-3 text-[10px] tracking-[0.18em] text-muted-foreground">
                  [{r.type.toUpperCase()}]
                </span>
              </span>
              <span className="mono hidden text-xs text-muted-foreground sm:block">{r.stack}</span>
              <span className="mono hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: LANG_COLOR[r.language] ?? "var(--color-border)" }}
                />
                {r.language}
              </span>
              <span className="mono hidden text-right text-xs text-foreground sm:block">
                ◇ {r.stars}
              </span>
              <span className="mono text-right text-[11px] tracking-[0.14em] text-muted-foreground">
                {r.activity.toUpperCase()}
              </span>
            </motion.a>
          ))}
        </div>

        {/* profile link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-between gap-6"
        >
          <p className="mono max-w-md text-xs leading-relaxed text-muted-foreground">
            <span className="text-signal-dim">/ / </span>
            Full source, experiments and research code live on the public profile.
          </p>
          <a
            href={IDENTITY.github}
            target="_blank"
            rel="noreferrer noopener"
            className="rule-link group mono text-xs tracking-[0.22em] text-foreground"
          >
            {"<>"} GITHUB.COM/YUSUFCINARCI
            <span className="rule-link-under group-hover:origin-left group-hover:scale-x-100" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
