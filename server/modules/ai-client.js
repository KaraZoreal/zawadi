import crypto from "node:crypto";

// AI Client — abstraction over OpenAI-compatible APIs.
// Supports: OpenAI, Anthropic (via OpenAI-compat), local LLMs (Ollama, LM Studio).
// Configure via env: AI_PROVIDER, AI_API_KEY, AI_BASE_URL, AI_MODEL

const providers = {
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-sonnet-4-20250514" },
  deepseek: { baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  ollama: { baseUrl: "http://localhost:11434/v1", defaultModel: "llama3" },
  lmstudio: { baseUrl: "http://localhost:1234/v1", defaultModel: "local-model" }
};

const configured =
  Boolean(process.env.AI_API_KEY) || process.env.AI_PROVIDER === "ollama" || process.env.AI_PROVIDER === "lmstudio";

const provider = process.env.AI_PROVIDER || "deepseek";
const providerConfig = providers[provider] || providers.deepseek;

const baseUrl = process.env.AI_BASE_URL || providerConfig.baseUrl;
const model = process.env.AI_MODEL || providerConfig.defaultModel;
const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || "";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1200;
const DEFAULT_TIMEOUT_MS = 90000;

function headers() {
  const hdrs = { "Content-Type": "application/json" };
  if (apiKey) {
    hdrs["Authorization"] = `Bearer ${apiKey}`;
    // Anthropic requires x-api-key header for their OpenAI-compat endpoint
    if (provider === "anthropic") {
      hdrs["x-api-key"] = apiKey;
    }
  }
  return hdrs;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chatCompletion({
  messages,
  temperature = 0.7,
  maxTokens = 2048,
  responseFormat = undefined,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  jsonMode = false
}) {
  if (!configured) {
    return mockCompletion(messages);
  }

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens
  };

  if (jsonMode || responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`AI API error ${response.status}: ${errorText.slice(0, 300)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      if (jsonMode || responseFormat === "json_object") {
        return extractJson(content);
      }

      return content;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && error.name !== "AbortError") {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("AI request failed after retries");
}

function extractJson(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find JSON object in the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    return { _raw: text, _parseError: "Could not parse JSON from response" };
  }
}

// Mock completion for development without API keys
function mockCompletion(messages) {
  const lastMessage = messages[messages.length - 1]?.content || "";

  if (lastMessage.includes("document type") || lastMessage.includes("classify")) {
    return JSON.stringify({
      documentType: "CV",
      confidence: 0.72,
      reasoning: "Mock analysis — configure AI_API_KEY for real detection",
      extractedData: {}
    });
  }

  if (lastMessage.includes("essay") && lastMessage.includes("scholarship")) {
    return `# Personal Statement\n\nAs a dedicated scholar from Africa, I have consistently pursued excellence in my academic journey...\n\n[Note: Configure AI_API_KEY for AI-generated essays tailored to your background.]`;
  }

  if (lastMessage.includes("fill") || lastMessage.includes("application form")) {
    return JSON.stringify({
      filled: true,
      fields: {},
      issues: [],
      note: "Mock auto-fill — configure AI_API_KEY for intelligent form completion"
    });
  }

  return JSON.stringify({ ok: true, note: "Mock AI response — configure AI_API_KEY" });
}

// Prompt builder helpers

function buildSystemPrompt(context = "") {
  return {
    role: "system",
    content: `You are Zawadi AI, an expert scholarship application assistant for African students. ${context}

Key principles:
- You understand African education systems, grading scales, and document formats across nations
- You help applicants present their best selves while being truthful
- You identify missing information and ask for clarification when needed
- Every essay is personalized — never use templates or generic text
- You work WITH the applicant, not instead of them — you are a collaborator

Current date: ${new Date().toISOString().split("T")[0]}`
  };
}

function buildUserPrompt(content) {
  return { role: "user", content };
}

export {
  configured as aiConfigured,
  provider as aiProvider,
  model as aiModel,
  chatCompletion,
  buildSystemPrompt,
  buildUserPrompt
};
