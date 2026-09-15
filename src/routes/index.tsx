import React from "react";
import { Suspense } from "react";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { fetchGitHubStats, fetchGitHubRepoDetails } from "@/lib/github-api";
import { Hero } from "@/components/system/Hero";
import { Footer } from "@/components/system/Footer";
import { NavIndicator } from "@/components/system/NavIndicator";
import { SectionSkeleton } from "@/components/system/SectionSkeleton";
import { SectionErrorBoundary } from "@/components/system/SectionErrorBoundary";

const Identity = React.lazy(() =>
  import("@/components/system/Identity").then((m) => ({ default: m.Identity })),
);
const Experience = React.lazy(() =>
  import("@/components/system/Experience").then((m) => ({ default: m.Experience })),
);
const Projects = React.lazy(() =>
  import("@/components/system/Projects").then((m) => ({ default: m.Projects })),
);
const TechStack = React.lazy(() =>
  import("@/components/system/TechStack").then((m) => ({ default: m.TechStack })),
);
const AiPipeline = React.lazy(() =>
  import("@/components/system/AiPipeline").then((m) => ({ default: m.AiPipeline })),
);
const GitHubSection = React.lazy(() =>
  import("@/components/system/GitHubSection").then((m) => ({ default: m.GitHubSection })),
);

export const Route = createFileRoute("/")({
  loader: async () => {
    const [stats, repoDetails] = await Promise.all([
      fetchGitHubStats(),
      fetchGitHubRepoDetails(),
    ]);
    return { stats, repoDetails };
  },
  head: () => ({
    meta: [
      { title: "Yusuf Çınar — AI Engineer" },
      {
        name: "description",
        content:
          "Operating interface of Yusuf Çınar, AI Engineer — multi-agent systems, computer vision and NLP pipelines. OBSS, TÜBİTAK, AI-native development.",
      },
      { property: "og:title", content: "Yusuf Çınar — AI Engineer" },
      {
        property: "og:description",
        content:
          "A scroll-driven system interface: multi-agent systems, computer vision, NLP pipelines and AI-native development.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { stats, repoDetails } = useLoaderData({ from: "/" });

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <NavIndicator />
      <Hero />
      <SectionErrorBoundary>
        <Suspense fallback={<SectionSkeleton minHeight="180vh" />}>
          <Identity />
        </Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <Suspense fallback={<SectionSkeleton minHeight="100vh" />}>
          <Experience />
        </Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <Suspense fallback={<SectionSkeleton minHeight="420vh" />}>
          <Projects />
        </Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <Suspense fallback={<SectionSkeleton minHeight="100vh" />}>
          <TechStack />
        </Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <Suspense fallback={<SectionSkeleton minHeight="220vh" />}>
          <AiPipeline />
        </Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary>
        <Suspense fallback={<SectionSkeleton minHeight="100vh" />}>
          <GitHubSection stats={stats} repoDetails={repoDetails} />
        </Suspense>
      </SectionErrorBoundary>
      <Footer />
    </main>
  );
}
