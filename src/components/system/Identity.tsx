import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { IDENTITY } from "@/lib/portfolio-data";

type Layer = {
  key: string;
  value: string;
  from: { x: number; y: number };
};

const LAYERS: Layer[] = [
  { key: "NAME", value: "Yusuf Çınar", from: { x: 0, y: -160 } },
  { key: "ROLE", value: "AI Engineer", from: { x: -220, y: 0 } },
  { key: "DOMAIN", value: "Multi-Agent · Vision · NLP", from: { x: 220, y: 0 } },
  { key: "AFFILIATION", value: "OBSS · TÜBİTAK", from: { x: 0, y: 160 } },
];

function LayerRow({ layer, progress, i }: { layer: Layer; progress: MotionValue<number>; i: number }) {
  const start = 0.05 + i * 0.06;
  const x = useTransform(progress, [start, start + 0.45], [layer.from.x, 0]);
  const y = useTransform(progress, [start, start + 0.45], [layer.from.y, 0]);
  const opacity = useTransform(progress, [start, start + 0.2], [0, 1]);
  const blurOut = useTransform(progress, [start, start + 0.45], [0.4, 1]);

  return (
    <motion.div
      style={{ x, y, opacity, scaleY: blurOut }}
      className="hair grid grid-cols-[8rem_1fr] items-baseline gap-4 border-x-0 border-b-0 border-t px-1 py-4 sm:grid-cols-[12rem_1fr]"
    >
      <span className="label">{layer.key}</span>
      <span className="text-2xl font-medium tracking-[-0.02em] sm:text-4xl">{layer.value}</span>
    </motion.div>
  );
}

export function Identity() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const frameWidth = useTransform(scrollYProgress, [0.1, 0.7], ["30%", "100%"]);
  const indexOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  return (
    <div id="identity" ref={ref} className="relative h-[180vh] w-full">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-10">
          <div className="flex items-baseline justify-between">
            <motion.span style={{ opacity: indexOpacity }} className="label">
              <span className="text-signal">01</span> / IDENTITY
            </motion.span>
            <motion.span style={{ opacity: indexOpacity }} className="label">
              LAYER ALIGNMENT
            </motion.span>
          </div>
          <motion.div style={{ width: frameWidth }} className="mt-3 h-px bg-signal" />

          <div className="mt-8">
            {LAYERS.map((l, i) => (
              <LayerRow key={l.key} layer={l} progress={scrollYProgress} i={i} />
            ))}
          </div>

          <div className="mono mt-8 max-w-xl text-xs leading-relaxed text-muted-foreground">
            <span className="text-signal-dim">/ / </span>
            Systems that plan, perceive and act. Research-grade computer vision, production NLP
            pipelines and agentic development workflows.
            <span className="pl-2 text-border">
              [{IDENTITY.domains.length} ACTIVE DOMAINS]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
