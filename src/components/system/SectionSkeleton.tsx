export function SectionSkeleton({ minHeight }: { minHeight: string }) {
  return (
    <div style={{ minHeight }} className="relative w-full animate-pulse bg-background">
      <div className="mx-auto h-full w-full max-w-[1400px] px-5 sm:px-10">
        <div className="h-full w-full" />
      </div>
    </div>
  );
}
