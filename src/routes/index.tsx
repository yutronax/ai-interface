import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { fetchGitHubStats } from "@/lib/github-api";
import { Hero } from "@/components/system/Hero";
import { Identity } from "@/components/system/Identity";
import { Experience } from "@/components/system/Experience";
import { Projects } from "@/components/system/Projects";
import { TechStack } from "@/components/system/TechStack";
import { AiPipeline } from "@/components/system/AiPipeline";
import { GitHubSection } from "@/components/system/GitHubSection";
import { Footer } from "@/components/system/Footer";
import { NavIndicator } from "@/components/system/NavIndicator";

export const Route = createFileRoute("/")({
  loader: () => fetchGitHubStats(),
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
  const stats = useLoaderData({ from: "/" });

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <NavIndicator />
      <Hero />
      <Identity />
      <Experience />
      <Projects />
      <TechStack />
      <AiPipeline />
      <GitHubSection stats={stats} />
      <Footer />
    </main>
  );
}
