import { motion } from "motion/react";

/** SVG scene: raw Sentinel-2 tile → predicted flood mask → model comparison. */
export function SatelliteViz() {
  const cells = Array.from({ length: 64 }, (_, i) => i);
  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_1fr_1.2fr]">
      <figure className="hair p-3">
        <figcaption className="label mb-2">SCENE / SENTINEL-2</figcaption>
        <svg viewBox="0 0 120 120" className="w-full" role="img" aria-label="Satellite tile">
          {cells.map((i) => {
            const x = (i % 8) * 15;
            const y = Math.floor(i / 8) * 15;
            const v = ((i * 37) % 11) / 11;
            return (
              <motion.rect
                key={i}
                x={x}
                y={y}
                width={15}
                height={15}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.25 + v * 0.5 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.008 }}
                fill="var(--color-surface-2)"
              />
            );
          })}
        </svg>
      </figure>

      <figure className="hair p-3">
        <figcaption className="label mb-2">MASK / PREDICTION</figcaption>
        <svg viewBox="0 0 120 120" className="w-full" role="img" aria-label="Flood segmentation mask">
          <rect width="120" height="120" fill="var(--color-surface)" />
          <motion.path
            d="M4 74 C24 58 34 92 56 78 C76 66 86 96 116 82 L116 116 L4 116 Z"
            fill="color-mix(in oklab, var(--color-signal) 30%, transparent)"
            stroke="var(--color-signal)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          <motion.path
            d="M10 30 L40 44 L70 26 L110 40"
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.3 }}
          />
        </svg>
      </figure>

      <figure className="hair p-3">
        <figcaption className="label mb-2">MODEL COMPARISON</figcaption>
        <div className="mono space-y-3 pt-1 text-[11px]">
          {[
            { name: "U-Net", w: 62 },
            { name: "DeepLabV3+", w: 74, hot: true },
          ].map((m, i) => (
            <div key={m.name}>
              <div className="flex justify-between text-muted-foreground">
                <span style={{ color: m.hot ? "var(--color-signal)" : undefined }}>{m.name}</span>
                <span>IoU {m.w}</span>
              </div>
              <div className="mt-1 h-2 w-full bg-surface-2">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: m.hot ? "var(--color-signal)" : "var(--color-border)" }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${m.w}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
            </div>
          ))}
          <div className="pt-1 text-signal">U-Net → DeepLabV3+ &nbsp;·&nbsp; IoU +12% &nbsp;·&nbsp; GEN +10%</div>
        </div>
      </figure>
    </div>
  );
}
