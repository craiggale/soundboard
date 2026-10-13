export const PRACTICES = ["Creative", "Experience", "Customer Technology"] as const;
export type Practice = (typeof PRACTICES)[number];

export const PURPOSES = [
  { id: "productivity", label: "Everyday productivity" },
  { id: "content", label: "Content & copy" },
  { id: "creative", label: "Creative & visuals" },
  { id: "video", label: "Video & voice" },
  { id: "localisation", label: "Localisation & translation" },
  { id: "marketing", label: "Marketing & campaigns" },
  { id: "research", label: "Research & insight" },
  { id: "design", label: "Design & experience" },
  { id: "engineering", label: "Engineering & development" },
  { id: "data", label: "Data & analytics" },
  { id: "commerce", label: "Commerce & personalisation" },
  { id: "contentops", label: "Content operations" },
  { id: "agents", label: "Building agents" },
] as const;
export type PurposeId = (typeof PURPOSES)[number]["id"];
export const PURPOSE_IDS = PURPOSES.map((p) => p.id) as [PurposeId, ...PurposeId[]];
export const purposeLabel = (id: string) => PURPOSES.find((p) => p.id === id)?.label ?? id;

// Areas people pick to narrow the deck. Everyday productivity isn't an area: assistants are always shown.
export const AREAS = PURPOSES.filter((p) => p.id !== "productivity");
export type AreaId = Exclude<PurposeId, "productivity">;

type Category = { label: string; purpose: AreaId | null; tools: string[] };

// Edit tools here. A tool listed under several categories is merged into one card.
const CATEGORIES: Category[] = [
  {
    label: "Enterprise AI Assistants",
    purpose: null,
    tools: ["M365 Copilot", "Copilot Chat", "Amethyst", "Generate Insights", "ChatGPT Enterprise", "Gemini Enterprise", "Claude", "Perplexity", "Glean", "Moveworks"],
  },
  {
    label: "Agent Platforms",
    purpose: "agents",
    tools: ["Reinvention AI", "Song.AI", "Song Workbench", "Amethyst Studio", "Copilot Studio", "Vertex AI Agent Builder", "LangGraph", "CrewAI", "AutoGen", "Semantic Kernel"],
  },
  {
    label: "Content & Copy Generation",
    purpose: "content",
    tools: ["Writer", "Jasper", "Copy.ai", "Typeface", "Persado", "Grammarly AI", "Notion AI", "Anyword"],
  },
  {
    label: "Creative AI",
    purpose: "creative",
    tools: ["Adobe Firefly", "Midjourney", "DALL-E", "Runway", "Kling", "Veo", "Stable Diffusion", "Ideogram", "Leonardo AI", "Luma", "Synthesia", "HeyGen"],
  },
  {
    label: "Localisation & Translation",
    purpose: "localisation",
    tools: ["LING.AI", "Phrase", "Smartling", "Lokalise", "DeepL", "RWS Trados AI", "Intento", "Unbabel"],
  },
  {
    label: "Marketing & Campaign AI",
    purpose: "marketing",
    tools: ["AdTune", "Marketing Investment Navigator", "Salesforce Einstein", "Marketing Cloud GPT", "Adobe GenStudio", "Adobe Journey Optimizer AI", "Adobe Sensei", "Optimizely AI", "Mutiny", "Jasper Marketing Suite"],
  },
  {
    label: "Research & Insight",
    purpose: "research",
    tools: ["Deep Research Agent", "Elysia", "Perplexity", "NotebookLM", "AlphaSense", "Quid", "Brandwatch AI", "Synthesio", "SparkToro", "Crayon"],
  },
  {
    label: "Design & Experience",
    purpose: "design",
    tools: ["Figma AI", "Galileo", "Uizard", "Relume", "Framer AI", "v0", "Lovable", "Bolt", "Replit Agent"],
  },
  {
    label: "Engineering & Development",
    purpose: "engineering",
    tools: ["GitHub Copilot", "Cursor", "Windsurf", "Claude Code", "Gemini CLI", "OpenAI Codex", "Sourcegraph Cody", "Tabnine", "Amazon Q Developer"],
  },
  {
    label: "Data & Analytics",
    purpose: "data",
    tools: ["Databricks AI", "Dataiku", "DataRobot", "Dataiku Stories", "Power BI Copilot", "Tableau Pulse", "ThoughtSpot Sage", "Alteryx AI"],
  },
  {
    label: "Commerce & Personalisation",
    purpose: "commerce",
    tools: ["Dynamic Yield", "Bloomreach", "Coveo", "Constructor", "Algolia AI", "Adobe Target AI", "Salesforce Personalization"],
  },
  {
    label: "DAM / Content Operations",
    purpose: "contentops",
    tools: ["Gradial", "Bynder AI", "Aprimo AI", "Frontify AI", "Sitecore AI", "Contentstack AI"],
  },
  {
    label: "Video, Voice & Avatar",
    purpose: "video",
    tools: ["Synthesia", "HeyGen", "ElevenLabs", "Descript", "Riverside AI", "Clipchamp AI", "Captions AI"],
  },
];

// Shown first in every deck, with a badge.
const EMERGING = ["AdTune", "Song.AI", "Song Workbench", "Reinvention AI", "Writer", "Gradial", "Deep Research Agent"];

export type Tool = {
  name: string;
  category: string;
  purposes: AreaId[];
  emerging: boolean;
  alwaysShown: boolean;
};

function buildTools(): Tool[] {
  const byName = new Map<string, Tool>();
  for (const category of CATEGORIES) {
    for (const name of category.tools) {
      const tool = byName.get(name) ?? {
        name,
        category: category.label,
        purposes: [],
        emerging: EMERGING.includes(name),
        alwaysShown: false,
      };
      if (category.purpose && !tool.purposes.includes(category.purpose)) tool.purposes.push(category.purpose);
      if (category.purpose === null) tool.alwaysShown = true;
      byName.set(name, tool);
    }
  }
  return [...byName.values()];
}

export const TOOLS = buildTools();
export const TOOL_NAMES = TOOLS.map((t) => t.name) as [string, ...string[]];
export const toolByName = (name: string) => TOOLS.find((t) => t.name === name);

export function buildDeck(areas: AreaId[]): Tool[] {
  const relevant = TOOLS.filter(
    (tool) => tool.emerging || tool.alwaysShown || tool.purposes.some((p) => areas.includes(p)),
  );
  return [...relevant.filter((t) => t.emerging), ...relevant.filter((t) => !t.emerging)];
}

export const VERDICTS = ["uses", "not_used", "unaware"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const BARRIERS = [
  "No access or licence",
  "Not sure what's approved",
  "No time to learn",
  "Don't trust the output",
  "Haven't found the right tool",
  "Not relevant to my work",
] as const;

export const IMPACT_LABELS = [
  "Nice to have",
  "Handy",
  "Really useful",
  "Part of how I work",
  "Couldn't do without it",
];
