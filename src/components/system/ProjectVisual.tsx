import { motion } from "motion/react";
import type { Project } from "@/lib/portfolio-data";

export function ProjectVisual({ kind }: { kind: Project["kind"] }) {
  if (kind === "satellite") {
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full" role="img" aria-label="Segmentation preview">
        <rect width="200" height="120" fill="var(--color-surface)" />
        {Array.from({ length: 40 }, (_, i) => (
          <rect
            key={i}
            x={(i % 10) * 20}
            y={Math.floor(i / 10) * 30}
            width="20"
            height="30"
            fill="var(--color-surface-2)"
            opacity={0.3 + ((i * 13) % 7) / 14}
          />
        ))}
        <motion.path
          d="M0 84 C30 66 52 100 80 86 C112 70 140 104 200 88 L200 120 L0 120 Z"
          fill="color-mix(in oklab, var(--color-signal) 28%, transparent)"
          stroke="var(--color-signal)"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4 }}
        />
      </svg>
    );
  }

  if (kind === "vision-language") {
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full" role="img" aria-label="Vision language fusion">
        <rect width="200" height="120" fill="var(--color-surface)" />
        {Array.from({ length: 9 }, (_, i) => (
          <motion.rect
            key={i}
            x={12 + (i % 3) * 20}
            y={20 + Math.floor(i / 3) * 20}
            width="16"
            height="16"
            fill="none"
            stroke="var(--color-signal-dim)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <motion.line
            key={i}
            x1="78"
            y1={30 + i * 16}
            x2="130"
            y2="60"
            stroke="var(--color-signal)"
            strokeWidth="0.6"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
          />
        ))}
        <rect x="132" y="46" width="52" height="28" fill="none" stroke="var(--color-signal)" />
        <text x="140" y="64" className="mono" fontSize="8" fill="var(--color-signal)">
          FUSION
        </text>
      </svg>
    );
  }

  if (kind === "os") {
    return (
      <div className="mono h-full w-full bg-surface p-4 text-[10px] leading-relaxed text-muted-foreground">
        {[
          "/system",
          "├── agents/",
          "│   ├── planner.ts",
          "│   └── executor.ts",
          "├── windows/",
          "└── kernel.ts",
        ].map((l, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{ color: i === 0 ? "var(--color-signal)" : undefined }}
          >
            {l}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" role="img" aria-label="Metric plot">
      <rect width="200" height="120" fill="var(--color-surface)" />
      {[24, 48, 72, 96].map((y) => (
        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
      ))}
      <motion.polyline
        points="4,100 30,82 56,88 82,58 108,64 134,36 160,42 196,18"
        fill="none"
        stroke="var(--color-signal)"
        strokeWidth="1.4"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4 }}
      />
      {[100, 82, 88, 58, 64, 36, 42, 18].map((y, i) => (
        <motion.circle
          key={i}
          cx={4 + i * 27}
          cy={y}
          r="1.8"
          fill="var(--color-amber)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + i * 0.08 }}
        />
      ))}
    </svg>
  );
}
