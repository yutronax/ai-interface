import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Terminal-window chrome: title bar + bordered frame, shared across sections. */
export function TerminalWindow({
  title,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("hair relative flex flex-col bg-background/60 backdrop-blur-[2px]", className)}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 sm:px-5">
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="h-2.5 w-2.5 rounded-full border border-border" />
        <span className="h-2.5 w-2.5 rounded-full border border-signal" />
        <span className="mono ml-2 text-[10px] tracking-[0.2em] text-muted-foreground">
          {title}
        </span>
      </div>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}
