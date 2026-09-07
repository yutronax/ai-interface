import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "./Projects";
import type { Project } from "@/lib/portfolio-data";

/**
 * Mock project data for testing evidence link rendering.
 * Note: `evidence` field does not exist on Project type yet (implementation pending).
 * Tests use type casting to simulate the expected structure.
 */

const mockProjectWithEvidenceLink: Project & {
  evidence?: { type: "link"; url: string; label: string };
} = {
  index: "01",
  name: "test-project-with-evidence",
  kind: "satellite",
  summary: "Test project with tıklanabilir kanıt.",
  stack: ["PyTorch", "OpenCV"],
  detail: "Demonstrable project with external evidence link.",
  url: "https://github.com/yutronax/test-project",
  evidence: { type: "link", url: "https://example.com/demo", label: "VIEW DEMO →" },
};

const mockProjectWithoutEvidence: Project = {
  index: "02",
  name: "test-project-no-evidence",
  kind: "vision-language",
  summary: "Test project without tıklanabilir kanıt.",
  stack: ["Transformers"],
  detail: "Project without external evidence — existing GitHub link only.",
  url: "https://github.com/yutronax/test-project-2",
};

describe("Projects.Panel — Evidence Link Rendering (AC-1/AC-2/AC-5/AC-6)", () => {
  /**
   * AC-1 [Critical]: Given bir proje kartının kanıt verisi (örn. { type: "link", url: "...", label: "VIEW DEMO" }) tanımlıysa,
   * When kullanıcı kartı görüntüler,
   * Then kart içinde "OPEN ON GITHUB" linkinin yanında/altında ayrı bir tıklanabilir kanıt linki render edilir
   * (href = evidence.url, target="_blank", rel içerir "noreferrer").
   */
  describe("AC-1 [Critical]: Evidence link renders when evidence data defined", () => {
    it("should render evidence link element with correct href and target attributes", () => {
      render(<Panel p={mockProjectWithEvidenceLink as unknown as Project} />);

      // Evidence link should exist with correct href
      const evidenceLink = screen.getByRole("link", { name: /VIEW DEMO/i });
      expect(evidenceLink).toBeInTheDocument();
      expect(evidenceLink).toHaveAttribute("href", "https://example.com/demo");
      expect(evidenceLink).toHaveAttribute("target", "_blank");
    });

    it("should have rel='noreferrer' for security (noopener may be added)", () => {
      render(<Panel p={mockProjectWithEvidenceLink as unknown as Project} />);

      const evidenceLink = screen.getByRole("link", { name: /VIEW DEMO/i });
      const relValue = evidenceLink.getAttribute("rel") || "";
      expect(relValue).toContain("noreferrer");
    });

    it("should render evidence link separately from OPEN ON GITHUB link", () => {
      render(<Panel p={mockProjectWithEvidenceLink as unknown as Project} />);

      const githubLink = screen.getByRole("link", { name: /OPEN ON GITHUB/i });
      const evidenceLink = screen.getByRole("link", { name: /VIEW DEMO/i });

      expect(githubLink).toBeInTheDocument();
      expect(evidenceLink).toBeInTheDocument();
      expect(githubLink).not.toBe(evidenceLink);
    });

    it("should position evidence link visually distinct from GitHub link (DOM siblings or parent check)", () => {
      const { container } = render(<Panel p={mockProjectWithEvidenceLink as unknown as Project} />);

      const githubLink = screen.getByRole("link", { name: /OPEN ON GITHUB/i });
      const evidenceLink = screen.getByRole("link", { name: /VIEW DEMO/i });

      // Both links should be in the same panel (flexbox container)
      const panelContainer = container.querySelector("div.flex.h-\\[70vh\\]");
      expect(panelContainer?.contains(githubLink)).toBe(true);
      expect(panelContainer?.contains(evidenceLink)).toBe(true);
    });
  });

  /**
   * AC-2 [Critical]: Given bir proje kartının kanıt verisi tanımlı DEĞİLSE (undefined),
   * When kart render edilir,
   * Then ek kanıt linki render EDİLMEMELİ, sadece mevcut "OPEN ON GITHUB" linki bulunmalı.
   */
  describe("AC-2 [Critical]: No evidence link when evidence data undefined", () => {
    it("should not render evidence link when evidence field is undefined", () => {
      render(<Panel p={mockProjectWithoutEvidence} />);

      const githubLink = screen.getByRole("link", { name: /OPEN ON GITHUB/i });
      expect(githubLink).toBeInTheDocument();

      // Evidence link should NOT exist
      const evidenceLink = screen.queryByRole("link", { name: /VIEW DEMO/i });
      expect(evidenceLink).not.toBeInTheDocument();
    });

    it("should render only one link (GitHub) when evidence is undefined", () => {
      const { container } = render(<Panel p={mockProjectWithoutEvidence} />);

      // Count all anchor tags in the panel
      const panelDiv = container.querySelector("div.flex.h-\\[70vh\\]");
      const allLinks = panelDiv?.querySelectorAll("a");

      // Only one link: "OPEN ON GITHUB"
      expect(allLinks?.length).toBe(1);
      expect(allLinks?.[0]?.textContent).toContain("OPEN ON GITHUB");
    });

    it("should not break card rendering when evidence is undefined", () => {
      const { container } = render(<Panel p={mockProjectWithoutEvidence} />);

      // Card structure should be intact
      const panelDiv = container.querySelector("div.flex.h-\\[70vh\\]");
      const projectName = screen.getByText("test-project-no-evidence");

      expect(panelDiv).toBeInTheDocument();
      expect(projectName).toBeInTheDocument();
    });

    it("should render project details normally without evidence link", () => {
      render(<Panel p={mockProjectWithoutEvidence} />);

      const summary = screen.getByText(/Test project without tıklanabilir kanıt/i);
      const detail = screen.getByText(/Project without external evidence/i);

      expect(summary).toBeInTheDocument();
      expect(detail).toBeInTheDocument();
    });
  });

  /**
   * AC-5 [Medium]: Given bazı projelerde kanıt var bazılarında yok (aşamalı ekleme),
   * When proje listesi render edilir,
   * Then her kart bağımsız kendi verisine göre davranır,
   * tutarsızlık (bazı kartlarda ek eleman, bazılarında yok) kabul edilebilir bir durumdur.
   */
  describe("AC-5 [Medium]: Independent rendering for projects with/without evidence", () => {
    it("should render evidence link only in project with evidence, not in project without", () => {
      const { container: container1 } = render(
        <Panel p={mockProjectWithEvidenceLink as unknown as Project} />,
      );
      const { container: container2 } = render(<Panel p={mockProjectWithoutEvidence} />);

      // First panel (with evidence)
      const allLinksInFirst = container1.querySelectorAll("a");
      const evidenceLinkInFirst = Array.from(allLinksInFirst).find((link) =>
        link.textContent?.includes("VIEW DEMO"),
      );
      expect(evidenceLinkInFirst).toBeDefined();

      // Second panel (without evidence)
      const allLinksInSecond = container2.querySelectorAll("a");
      const evidenceLinkInSecond = Array.from(allLinksInSecond).find((link) =>
        link.textContent?.includes("VIEW DEMO"),
      );
      expect(evidenceLinkInSecond).toBeUndefined();
    });

    it("should maintain independent state for multiple projects with mixed evidence", () => {
      const projects: Array<Project & { evidence?: { type: "link"; url: string; label: string } }> =
        [
          mockProjectWithEvidenceLink,
          mockProjectWithoutEvidence,
          {
            ...mockProjectWithEvidenceLink,
            name: "another-with-evidence",
            url: "https://github.com/test2",
          },
        ];

      const renders = projects.map((p) => render(<Panel p={p as unknown as Project} />));

      // Project 1: has evidence
      expect(screen.getAllByText(/VIEW DEMO/i).length).toBeGreaterThan(0);

      // Project 2: no evidence (already verified in AC-2)
      // Project 3: has evidence

      renders.forEach(({ unmount }) => unmount());
    });
  });

  /**
   * AC-6 [Medium]: Given hiçbir projeye henüz kanıt eklenmemiş,
   * When build/deploy çalıştırılır,
   * Then build başarılı kalır (kanıt alanı opsiyonel tip), mevcut davranışta regresyon olmaz.
   */
  describe("AC-6 [Medium]: No regression when no projects have evidence", () => {
    it("should render panel successfully without evidence field in type definition", () => {
      // This test verifies that Panel component doesn't crash even if evidence is never added
      render(<Panel p={mockProjectWithoutEvidence} />);

      const panelContent = screen.getByText(/Project without external evidence/i);
      expect(panelContent).toBeInTheDocument();
    });

    it("should render all project information correctly when evidence is omitted", () => {
      render(<Panel p={mockProjectWithoutEvidence} />);

      expect(screen.getByText("test-project-no-evidence")).toBeInTheDocument();
      expect(screen.getByText(/Test project without tıklanabilir kanıt/i)).toBeInTheDocument();
      expect(screen.getByText(/Project without external evidence/i)).toBeInTheDocument();
      expect(screen.getByText(/Transformers/)).toBeInTheDocument();
    });

    it("should render GitHub link even when no evidence data exists anywhere in component tree", () => {
      render(<Panel p={mockProjectWithoutEvidence} />);

      const githubLink = screen.getByRole("link", { name: /OPEN ON GITHUB/i });
      expect(githubLink).toHaveAttribute("href", mockProjectWithoutEvidence.url);
      expect(githubLink).toHaveAttribute("target", "_blank");
    });

    it("should maintain TypeScript type safety with optional evidence field", () => {
      // Type check: mockProjectWithoutEvidence is of type Project (without evidence)
      // This should compile and render without type errors
      const { container } = render(<Panel p={mockProjectWithoutEvidence} />);

      const panel = container.querySelector("div.flex.h-\\[70vh\\]");
      expect(panel).toBeInTheDocument();
    });
  });

  /**
   * Additional tests for defensive rendering and edge cases.
   */
  describe("Edge Cases & Defensive Rendering", () => {
    it("should render link element with label text visible to users", () => {
      render(<Panel p={mockProjectWithEvidenceLink as unknown as Project} />);

      const evidenceLink = screen.getByRole("link", { name: /VIEW DEMO/i });
      expect(evidenceLink.textContent).toMatch(/VIEW DEMO/i);
    });

    it("should not mutate or modify original Project object during render", () => {
      const originalProject = { ...mockProjectWithoutEvidence };
      render(<Panel p={mockProjectWithoutEvidence} />);

      expect(mockProjectWithoutEvidence).toEqual(originalProject);
    });
  });
});
