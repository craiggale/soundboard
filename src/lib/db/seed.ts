// Initial catalogue, written to the database the first time the app connects.
// After that, manage everything from /admin.

export const SEED_CATEGORIES: {
  id: string;
  name: string;
  purpose: string | null;
  alwaysShown?: boolean;
  tools: string[];
}[] = [
  {
    id: "assistants",
    name: "Enterprise AI Assistants",
    purpose: null,
    alwaysShown: true,
    tools: ["M365 Copilot", "Copilot Chat", "Amethyst", "Generate Insights", "ChatGPT Enterprise", "Gemini Enterprise", "Claude", "Perplexity", "Glean", "Moveworks"],
  },
  {
    id: "agents",
    name: "Agent Platforms",
    purpose: "Building agents",
    tools: ["Reinvention AI", "Song.AI", "Song Workbench", "Amethyst Studio", "Copilot Studio", "Vertex AI Agent Builder", "LangGraph", "CrewAI", "AutoGen", "Semantic Kernel"],
  },
  {
    id: "content",
    name: "Content & Copy Generation",
    purpose: "Content & copy",
    tools: ["Writer", "Jasper", "Copy.ai", "Typeface", "Persado", "Grammarly AI", "Notion AI", "Anyword"],
  },
  {
    id: "creative",
    name: "Creative AI",
    purpose: "Creative & visuals",
    tools: ["Adobe Firefly", "Midjourney", "DALL-E", "Runway", "Kling", "Veo", "Stable Diffusion", "Ideogram", "Leonardo AI", "Luma", "Synthesia", "HeyGen"],
  },
  {
    id: "localisation",
    name: "Localisation & Translation",
    purpose: "Localisation & translation",
    tools: ["LING.AI", "Phrase", "Smartling", "Lokalise", "DeepL", "RWS Trados AI", "Intento", "Unbabel"],
  },
  {
    id: "marketing",
    name: "Marketing & Campaign AI",
    purpose: "Marketing & campaigns",
    tools: ["AdTune", "Marketing Investment Navigator", "Salesforce Einstein", "Marketing Cloud GPT", "Adobe GenStudio", "Adobe Journey Optimizer AI", "Adobe Sensei", "Optimizely AI", "Mutiny", "Jasper Marketing Suite"],
  },
  {
    id: "research",
    name: "Research & Insight",
    purpose: "Research & insight",
    tools: ["Deep Research Agent", "Elysia", "Perplexity", "NotebookLM", "AlphaSense", "Quid", "Brandwatch AI", "Synthesio", "SparkToro", "Crayon"],
  },
  {
    id: "design",
    name: "Design & Experience",
    purpose: "Design & experience",
    tools: ["Figma AI", "Galileo", "Uizard", "Relume", "Framer AI", "v0", "Lovable", "Bolt", "Replit Agent"],
  },
  {
    id: "engineering",
    name: "Engineering & Development",
    purpose: "Engineering & development",
    tools: ["GitHub Copilot", "Cursor", "Windsurf", "Claude Code", "Gemini CLI", "OpenAI Codex", "Sourcegraph Cody", "Tabnine", "Amazon Q Developer"],
  },
  {
    id: "data",
    name: "Data & Analytics",
    purpose: "Data & analytics",
    tools: ["Databricks AI", "Dataiku", "DataRobot", "Dataiku Stories", "Power BI Copilot", "Tableau Pulse", "ThoughtSpot Sage", "Alteryx AI"],
  },
  {
    id: "commerce",
    name: "Commerce & Personalisation",
    purpose: "Commerce & personalisation",
    tools: ["Dynamic Yield", "Bloomreach", "Coveo", "Constructor", "Algolia AI", "Adobe Target AI", "Salesforce Personalization"],
  },
  {
    id: "contentops",
    name: "DAM / Content Operations",
    purpose: "Content operations",
    tools: ["Gradial", "Bynder AI", "Aprimo AI", "Frontify AI", "Sitecore AI", "Contentstack AI"],
  },
  {
    id: "video",
    name: "Video, Voice & Avatar",
    purpose: "Video & voice",
    tools: ["Synthesia", "HeyGen", "ElevenLabs", "Descript", "Riverside AI", "Clipchamp AI", "Captions AI"],
  },
  { id: "productivity", name: "Everyday productivity", purpose: "Everyday productivity", tools: [] },
];

export const SEED_EMERGING = ["AdTune", "Song.AI", "Song Workbench", "Reinvention AI", "Writer", "Gradial", "Deep Research Agent"];

export const SEED_PRACTICES = [
  { name: "Customer Growth", summary: "Industry, strategy & insights" },
  { name: "Marketing", summary: "Brands, engagement and loyalty across channels and media" },
  { name: "Design & Digital Products", summary: "Digital services, products and ventures" },
  { name: "Commerce", summary: "Growth across commerce channels, from eCommerce to social" },
  { name: "Sales", summary: "Turning demand into revenue" },
  { name: "Service", summary: "High-value service experiences" },
  { name: "Customer Data & AI", summary: "AI-ready data, real-time insight and personalisation" },
];

export const SEED_BARRIERS = [
  "No access or licence",
  "Not sure what's approved",
  "No time to learn",
  "Don't trust the output",
  "Haven't found the right tool",
  "Not relevant to my work",
];

// Logo names from LobeHub (lobehub.com/icons) or Simple Icons (simpleicons.org).
// Tools without one show the Accenture mark.
export const SEED_LOGOS: Record<string, string> = {
  Claude: "claude",
  "Claude Code": "claudecode",
  Perplexity: "perplexity",
  "Gemini Enterprise": "googlegemini",
  "Gemini CLI": "googlegemini",
  Veo: "deepmind",
  "Vertex AI Agent Builder": "vertexai",
  NotebookLM: "notebooklm",
  LangGraph: "langgraph",
  CrewAI: "crewai",
  "Notion AI": "notion",
  "Grammarly AI": "grammarly",
  DeepL: "deepl",
  "Figma AI": "figma",
  "Framer AI": "framer",
  v0: "v0",
  "Replit Agent": "replit",
  "GitHub Copilot": "githubcopilot",
  Cursor: "cursor",
  Windsurf: "windsurf",
  "Databricks AI": "databricks",
  Dataiku: "dataiku",
  "Dataiku Stories": "dataiku",
  "Algolia AI": "algolia",
  "Sitecore AI": "sitecore",
  "Contentstack AI": "contentstack",
  "Frontify AI": "frontify",
  ElevenLabs: "elevenlabs",
  "M365 Copilot": "copilot",
  "Copilot Chat": "copilot",
  "Copilot Studio": "copilot",
  "Power BI Copilot": "copilot",
  "ChatGPT Enterprise": "openai",
  "OpenAI Codex": "codex",
  "DALL-E": "dalle",
  "Adobe Firefly": "adobefirefly",
  "Adobe GenStudio": "adobe",
  "Adobe Journey Optimizer AI": "adobe",
  "Adobe Sensei": "adobe",
  "Adobe Target AI": "adobe",
  Midjourney: "midjourney",
  Runway: "runway",
  Kling: "kling",
  Luma: "luma",
  Ideogram: "ideogram",
  "Stable Diffusion": "stability",
  AutoGen: "microsoft",
  "Semantic Kernel": "microsoft",
  "Clipchamp AI": "microsoft",
  "Amazon Q Developer": "aws",
  Lovable: "lovable",
};

// Accenture-built tools only come as the official version, so we don't ask which version people use.
export const SEED_ACCENTURE_ONLY = [
  "Amethyst",
  "Amethyst Studio",
  "Generate Insights",
  "Reinvention AI",
  "Song.AI",
  "Song Workbench",
  "LING.AI",
  "AdTune",
  "Marketing Investment Navigator",
  "Deep Research Agent",
];
