export const IDENTITY = {
  name: "YUSUF ÇINAR",
  role: "AI Engineer",
  domains: ["MULTI-AGENT SYSTEMS", "COMPUTER VISION", "NLP PIPELINES"],
  status: ["OBSS AI INTERN", "TÜBİTAK RESEARCHER"],
  github: "https://github.com/yusufcinarci",
  linkedin: "https://www.linkedin.com/in/yusufcinarci/",
};

export type Experience = {
  id: string;
  org: string;
  period: string;
  state: string;
  rows: { key: string; value: string }[];
  metrics?: { value: string; unit: string; label: string }[];
};

export const EXPERIENCES: Experience[] = [
  {
    id: "obss",
    org: "OBSS",
    period: "2025 —",
    state: "PROCESS RUNNING",
    rows: [
      { key: "ROLE", value: "AI Intern" },
      { key: "INPUT", value: "AI-Native Development" },
      { key: "STACK", value: "Claude / Cursor / Codex" },
      { key: "METHOD", value: "ATDD / Test-first / Red-team" },
    ],
  },
  {
    id: "mavi",
    org: "MAVİ LOJİSTİK",
    period: "2024 — 2025",
    state: "PROCESS COMPLETE",
    rows: [
      { key: "ROLE", value: "AI Developer" },
      { key: "INPUT", value: "WhatsApp operations channel" },
      { key: "STACK", value: "NLP pipeline / LLM routing / Automation" },
      { key: "OUTPUT", value: "Autonomous message triage + response" },
    ],
    metrics: [
      { value: "2,000+", unit: "", label: "MESSAGES / DAY" },
      { value: "85–90", unit: "%", label: "AUTOMATION" },
      { value: "3 MIN → 5 SEC", unit: "", label: "RESPONSE LATENCY" },
    ],
  },
  {
    id: "tubitak",
    org: "TÜBİTAK",
    period: "2024",
    state: "RESEARCH ARCHIVED",
    rows: [
      { key: "ROLE", value: "Researcher" },
      { key: "INPUT", value: "20,000+ Sentinel-2 scenes" },
      { key: "MODEL", value: "U-Net → DeepLabV3+" },
      { key: "TASK", value: "Semantic segmentation / flood mapping" },
    ],
    metrics: [
      { value: "+12", unit: "%", label: "IoU" },
      { value: "+10", unit: "%", label: "GENERALIZATION" },
      { value: "20,000+", unit: "", label: "SCENES" },
    ],
  },
];

export type Project = {
  index: string;
  name: string;
  kind: "satellite" | "vision-language" | "os" | "data";
  summary: string;
  stack: string[];
  detail: string;
  url: string;
};

export const PROJECTS: Project[] = [
  {
    index: "01",
    name: "flood-detection",
    kind: "satellite",
    summary: "Sentinel-2 flood segmentation over multi-region scenes.",
    stack: ["PyTorch", "DeepLabV3+", "Rasterio", "OpenCV"],
    detail: "U-Net baseline replaced by DeepLabV3+ with ASPP; IoU +12% on held-out regions.",
    url: "https://github.com/yusufcinarci",
  },
  {
    index: "02",
    name: "ViLT",
    kind: "vision-language",
    summary: "Vision-and-language transformer experiments without convolutions.",
    stack: ["Transformers", "PyTorch", "CLIP", "VQA"],
    detail: "Patch-embedded image tokens fused with text tokens in a single transformer stack.",
    url: "https://github.com/yusufcinarci",
  },
  {
    index: "03",
    name: "windowsphereAI",
    kind: "os",
    summary: "An agentic desktop-style environment for AI operations.",
    stack: ["React", "TypeScript", "LLM Agents", "FastAPI"],
    detail: "File-tree addressable agents; each window is a process with its own tool scope.",
    url: "https://github.com/yusufcinarci",
  },
  {
    index: "04",
    name: "ml-lab",
    kind: "data",
    summary: "Classical ML pipelines, benchmarking and feature analysis.",
    stack: ["scikit-learn", "NumPy", "Pandas", "Matplotlib"],
    detail: "Reproducible experiment runners with cross-validated metric reporting.",
    url: "https://github.com/yusufcinarci",
  },
];

export const TECH_GRAPH: { root: string; children: { name: string; leaves: string[] }[] } = {
  root: "Python",
  children: [
    { name: "PyTorch", leaves: ["U-Net", "DeepLabV3+", "ViLT"] },
    { name: "OpenCV", leaves: ["Preprocessing", "Masking"] },
    { name: "Transformers", leaves: ["NLP Pipelines", "LLM Routing"] },
    { name: "FastAPI", leaves: ["Serving", "Agents API"] },
  ],
};

export const PIPELINE = [
  {
    stage: "PLAN",
    tool: "Claude",
    body: "Specification, decomposition and red-team review before a single line is written.",
  },
  {
    stage: "BUILD",
    tool: "Cursor",
    body: "In-editor agentic implementation against the accepted specification.",
  },
  {
    stage: "VERIFY",
    tool: "Codex",
    body: "Test-first execution, regression sweeps and acceptance-driven validation.",
  },
];

export const REPOS = [
  {
    name: "flood-detection",
    language: "Python",
    stars: 12,
    activity: "recent",
    type: "research",
    stack: "PyTorch · Rasterio",
  },
  {
    name: "ViLT",
    language: "Python",
    stars: 8,
    activity: "2 months",
    type: "experiment",
    stack: "Transformers",
  },
  {
    name: "windowsphereAI",
    language: "TypeScript",
    stars: 21,
    activity: "active",
    type: "system",
    stack: "React · FastAPI",
  },
  {
    name: "ml-lab",
    language: "Jupyter",
    stars: 5,
    activity: "6 months",
    type: "notebooks",
    stack: "scikit-learn",
  },
];

export const SECTIONS = [
  { id: "system", label: "SYSTEM" },
  { id: "identity", label: "IDENTITY" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "projects", label: "PROJECTS" },
  { id: "stack", label: "STACK" },
  { id: "github", label: "GITHUB" },
];
