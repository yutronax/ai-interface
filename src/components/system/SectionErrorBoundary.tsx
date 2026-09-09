import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class SectionErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("[SectionErrorBoundary]", error);
  }

  handleRetry = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="mono flex min-h-[40vh] flex-col items-center justify-center gap-4 text-xs text-muted-foreground">
          <p>Unable to load this section.</p>
          <button
            type="button"
            tabIndex={0}
            onClick={this.handleRetry}
            className="border border-border px-3 py-1.5 text-[10px] tracking-[0.2em] hover:border-signal hover:text-signal"
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
