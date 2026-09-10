import { useEffect, useState } from "react";

/** Types `text` out character by character. `active` gates when typing starts. */
export function useTypewriter(text: string, speed: number, startDelay: number, active: boolean) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    setTyped("");
    setDone(false);
    let i = 0;
    let interval: number;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i++;
        setTyped(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [text, speed, startDelay, active]);

  return { typed, done };
}

export function Cursor() {
  return (
    <span aria-hidden className="animate-pulse" style={{ color: "var(--color-signal)" }}>
      ▊
    </span>
  );
}
