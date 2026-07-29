var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);

// src/offlineAnalyzer.ts
var rules_fa = [
  {
    regex: /(همه|هیچکس|همیشه|هرگز|همه‌چیز|هیچ‌چیز|عموماً|اکثراً|به‌طور کلی)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0639\u0645\u06CC\u0645 \u0634\u062A\u0627\u0628\u200C\u0632\u062F\u0647 (Hasty Generalization)",
    explanation: "\u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0627\u0632 \u06A9\u0644\u0645\u0627\u062A \u0645\u0637\u0644\u0642 \u06CC\u0627 \u062A\u0639\u0645\u06CC\u0645\u200C\u0647\u0627\u06CC \u06A9\u0644\u06CC \u0628\u062F\u0648\u0646 \u0627\u0631\u0627\u0626\u0647 \u0646\u0645\u0648\u0646\u0647\u200C\u0647\u0627\u06CC \u0622\u0645\u0627\u0631\u06CC \u06A9\u0627\u0641\u06CC\u060C \u0645\u0639\u0645\u0648\u0644\u0627\u064B \u0645\u0646\u062C\u0631 \u0628\u0647 \u0646\u0627\u062F\u06CC\u062F\u0647 \u06AF\u0631\u0641\u062A\u0646 \u0627\u0633\u062A\u062B\u0646\u0627\u0647\u0627 \u0648 \u0645\u062E\u062F\u0648\u0634 \u0634\u062F\u0646 \u0627\u0633\u062A\u062F\u0644\u0627\u0644 \u0645\u06CC\u200C\u0634\u0648\u062F."
  },
  {
    regex: /(معلوم است|بدیهی است|کاملا مشخص است|همانطور که می‌دانیم|شک ندارم که|پر واضح است)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u0645\u0635\u0627\u062F\u0631\u0647 \u0628\u0647 \u0645\u0637\u0644\u0648\u0628 (Begging the Question)",
    explanation: "\u0627\u062F\u0639\u0627\u06CC \u0627\u06CC\u0646\u06A9\u0647 \u0645\u0648\u0636\u0648\u0639\u06CC \u0630\u0627\u062A\u0627\u064B \u0627\u062B\u0628\u0627\u062A\u200C\u0634\u062F\u0647 \u0648 \u0628\u062F\u06CC\u0647\u06CC \u0627\u0633\u062A\u060C \u0645\u0639\u0645\u0648\u0644\u0627\u064B \u062A\u0644\u0627\u0634\u06CC \u0628\u0631\u0627\u06CC \u0637\u0641\u0631\u0647 \u0631\u0641\u062A\u0646 \u0627\u0632 \u0627\u0631\u0627\u0626\u0647 \u0634\u0648\u0627\u0647\u062F \u0648\u0627\u0642\u0639\u06CC \u0648 \u0627\u0633\u062A\u062F\u0644\u0627\u0644 \u0645\u0633\u062A\u062F\u0644 \u0628\u0647 \u0634\u0645\u0627\u0631 \u0645\u06CC\u200C\u0622\u06CC\u062F."
  },
  {
    regex: /(احمق|نادان|دروغگو|دیوانه|بی‌سواد|نفهم|خودت که|شخص شما|سابقه شما)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u062D\u0645\u0644\u0647 \u0634\u062E\u0635\u06CC / \u062A\u0648\u0633\u0644 \u0628\u0647 \u0634\u062E\u0635 (Ad Hominem)",
    explanation: "\u062D\u0645\u0644\u0647 \u0628\u0647 \u0648\u06CC\u0698\u06AF\u06CC\u200C\u0647\u0627\u06CC \u0634\u062E\u0635\u06CC\u062A\u06CC\u060C \u0633\u0627\u0628\u0642\u0647\u060C \u06CC\u0627 \u0627\u0646\u06AF\u06CC\u0632\u0647 \u06AF\u0648\u06CC\u0646\u062F\u0647 \u0628\u0647 \u062C\u0627\u06CC \u0628\u0647 \u0686\u0627\u0644\u0634 \u06A9\u0634\u06CC\u062F\u0646 \u0645\u0646\u0637\u0642\u06CC \u0627\u0635\u0644 \u0627\u0633\u062A\u062F\u0644\u0627\u0644 \u0648 \u0634\u0648\u0627\u0647\u062F \u0627\u0631\u0627\u0626\u0647\u200C\u0634\u062F\u0647."
  },
  {
    regex: /(یا ... یا|یا با ما یا|یا این راه یا|دوراهی)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u062F\u0648\u0631\u0627\u0647\u06CC \u06A9\u0627\u0630\u0628 (False Dilemma)",
    explanation: "\u0645\u062D\u062F\u0648\u062F \u06A9\u0631\u062F\u0646 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u0648\u062C\u0648\u062F \u0628\u0647 \u062F\u0648 \u062D\u0627\u0644\u062A \u0645\u062A\u0636\u0627\u062F \u0648 \u0627\u0641\u0631\u0627\u0637\u06CC \u062F\u0631 \u062D\u0627\u0644\u06CC \u06A9\u0647 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0648 \u0631\u0627\u0647\u200C\u062D\u0644\u200C\u0647\u0627\u06CC \u0645\u06CC\u0627\u0646\u0647 \u062F\u06CC\u06AF\u0631\u06CC \u0646\u06CC\u0632 \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u0646\u062F."
  },
  {
    regex: /(اکثریت مردم|همه دارند می‌گویند|همه موافقند|افکار عمومی|محبوبیت|بین مردم جا افتاده)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0627\u06A9\u062B\u0631\u06CC\u062A (Appeal to Popularity / Bandwagon)",
    explanation: "\u0627\u062F\u0639\u0627\u06CC \u0627\u06CC\u0646\u06A9\u0647 \u06CC\u06A9 \u0628\u0627\u0648\u0631 \u06CC\u0627 \u0639\u0645\u0644 \u0628\u0647 \u0627\u06CC\u0646 \u062F\u0644\u06CC\u0644 \u06A9\u0647 \u0637\u0631\u0641\u062F\u0627\u0631\u0627\u0646 \u06CC\u0627 \u067E\u06CC\u0631\u0648\u0627\u0646 \u0632\u06CC\u0627\u062F\u06CC \u062F\u0627\u0631\u062F\u060C \u0644\u0632\u0648\u0645\u0627\u064B \u062F\u0631\u0633\u062A\u060C \u0627\u062E\u0644\u0627\u0642\u06CC \u06CC\u0627 \u0645\u0646\u0637\u0642\u06CC \u0627\u0633\u062A."
  },
  {
    regex: /(اگر این اتفاق بیفتد قطعا فاجعه می‌شود|شیب لغزنده|سقوط کل جامعه|نابودی کامل)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u0634\u06CC\u0628 \u0644\u063A\u0632\u0646\u062F\u0647 (Slippery Slope)",
    explanation: "\u0627\u062F\u0639\u0627\u06CC \u0627\u062B\u0628\u0627\u062A\u200C\u0646\u0634\u062F\u0647 \u0645\u0628\u0646\u06CC \u0628\u0631 \u0627\u06CC\u0646\u06A9\u0647 \u0627\u0646\u062C\u0627\u0645 \u06CC\u06A9 \u0627\u0642\u062F\u0627\u0645 \u06A9\u0648\u0686\u06A9 \u0644\u0632\u0648\u0645\u0627\u064B \u0645\u0646\u062C\u0631 \u0628\u0647 \u0632\u0646\u062C\u06CC\u0631\u0647\u200C\u0627\u06CC \u0627\u0632 \u062D\u0648\u0627\u062F\u062B \u0648\u062D\u0634\u062A\u0646\u0627\u06A9 \u0648 \u063A\u06CC\u0631\u0642\u0627\u0628\u0644\u200C\u06A9\u0646\u062A\u0631\u0644 \u062E\u0648\u0627\u0647\u062F \u0634\u062F."
  },
  {
    regex: /(یک دانشمندی می‌گفت|شنیده‌ام که|می‌گویند که|به نقل از منابع غیررسمی|یک کارشناسی گفته)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0645\u0631\u062C\u0639 \u06A9\u0627\u0630\u0628 (Appeal to False Authority)",
    explanation: "\u0627\u0633\u062A\u0646\u0627\u062F \u0628\u0647 \u0645\u0631\u0627\u062C\u0639 \u0645\u0628\u0647\u0645\u060C \u0646\u0627\u0645\u0634\u062E\u0635 \u06CC\u0627 \u0641\u0627\u0642\u062F \u062A\u062E\u0635\u0635 \u0645\u0631\u062A\u0628\u0637 \u062F\u0631 \u062D\u0648\u0632\u0647 \u0645\u0648\u0631\u062F \u0628\u062D\u062B \u0628\u0631\u0627\u06CC \u0627\u062B\u0628\u0627\u062A \u0635\u062D\u062A \u06CC\u06A9 \u0627\u062F\u0639\u0627."
  },
  {
    regex: /(دلتان نمی‌سوزد|بی‌رحمی|احساسات|عواطف|ترحم|ترس از اینکه)/g,
    errorName: "\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0627\u062D\u0633\u0627\u0633\u0627\u062A (Appeal to Emotion)",
    explanation: "\u0628\u0647\u0631\u0647\u200C\u06AF\u06CC\u0631\u06CC \u0627\u0632 \u062E\u0634\u0645\u060C \u062A\u0631\u0633\u060C \u062F\u0644\u0633\u0648\u0632\u06CC \u06CC\u0627 \u0633\u0627\u06CC\u0631 \u0639\u0648\u0627\u0637\u0641 \u0645\u062E\u0627\u0637\u0628 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u0627\u0628\u0632\u0627\u0631 \u0645\u062A\u0642\u0627\u0639\u062F\u0633\u0627\u0632\u06CC \u0628\u0647 \u062C\u0627\u06CC \u0627\u0631\u0627\u0626\u0647 \u0628\u0631\u0627\u0647\u06CC\u0646 \u0639\u0642\u0644\u0627\u0646\u06CC."
  }
];
var rules_en = [
  {
    regex: /\b(always|never|everyone|nobody|all|none|generally|typically)\b/gi,
    errorName: "Hasty Generalization / Absolute Statement",
    explanation: "Using absolute words usually indicates a hasty generalization that ignores nuances, statistics, or counter-examples."
  },
  {
    regex: /\b(obviously|clearly|as we all know|it is undeniable|plainly|without doubt)\b/gi,
    errorName: "Begging the Question / Circular Logic",
    explanation: "Assuming the premise is true without providing evidence, often used to bypass logical reasoning."
  },
  {
    regex: /\b(stupid|idiot|liar|crazy|uneducated|ignorant|fool|your past|you yourself)\b/gi,
    errorName: "Ad Hominem",
    explanation: "Attacking the character, motive, or background of a person rather than addressing the substance of their argument."
  },
  {
    regex: /\b(either ... or|only two choices|with us or against|dilemma)\b/gi,
    errorName: "False Dilemma / False Dichotomy",
    explanation: "Presenting only two extreme alternatives when in fact more realistic options or compromise solutions exist."
  },
  {
    regex: /\b(majority|everyone agrees|public opinion|popular belief|society says)\b/gi,
    errorName: "Appeal to Popularity (Bandwagon)",
    explanation: "Asserting that a claim is true or good simply because a majority of people believe or do it."
  },
  {
    regex: /\b(leads to disaster|slippery slope|complete ruin|downfall of)\b/gi,
    errorName: "Slippery Slope Fallacy",
    explanation: "Claiming without sufficient evidence that a small initial step will inevitably lead to a chain of catastrophic events."
  },
  {
    regex: /\b(some scientist|heard that|they say|unnamed source|expert says)\b/gi,
    errorName: "Appeal to False Authority",
    explanation: "Citing an irrelevant, vague, or unqualified source or authority to back up an argument."
  },
  {
    regex: /\b(pity|feel bad|fear of|cruelty|emotions|feelings|scared)\b/gi,
    errorName: "Appeal to Emotion",
    explanation: "Using emotional language, pity, fear, or anger to win an argument in the absence of solid rational proof."
  }
];
function runOfflineAnalysis(text, lang) {
  const fallacies = [];
  const rules = lang === "fa" ? rules_fa : rules_en;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  sentences.forEach((sentence) => {
    let handled = false;
    rules.forEach((rule) => {
      if (!handled && rule.regex.test(sentence)) {
        fallacies.push({
          quote: sentence.trim(),
          errorName: rule.errorName,
          explanation: rule.explanation
        });
        handled = true;
      }
    });
  });
  return fallacies;
}

// server.ts
import_dotenv.default.config();
var CACHE_FILE = import_path.default.join(process.cwd(), "analysis_cache.json");
var SERVER_KEY_FILE = import_path.default.join(process.cwd(), "server_key.txt");
var globalServerApiKey = process.env.GEMINI_API_KEY || "";
try {
  if (import_fs.default.existsSync(SERVER_KEY_FILE)) {
    const savedKey = import_fs.default.readFileSync(SERVER_KEY_FILE, "utf-8").trim();
    if (savedKey) {
      globalServerApiKey = savedKey;
      console.log("[Server Log] Loaded persistent global server API Key from server_key.txt");
    }
  }
} catch (err) {
  console.error("[Server Log] Failed to load server_key.txt:", err);
}
var analysisCache = {};
try {
  if (import_fs.default.existsSync(CACHE_FILE)) {
    analysisCache = JSON.parse(import_fs.default.readFileSync(CACHE_FILE, "utf-8"));
    console.log(`[Cache] Loaded ${Object.keys(analysisCache).length} cached analyses.`);
  }
} catch (err) {
  console.error("[Cache] Failed to load cache file:", err);
}
function saveCache() {
  try {
    import_fs.default.writeFileSync(CACHE_FILE, JSON.stringify(analysisCache, null, 2), "utf-8");
  } catch (err) {
    console.error("[Cache] Failed to save cache file:", err);
  }
}
function normalizeTextForCache(text) {
  if (!text) return "";
  let norm = text.trim().toLowerCase();
  norm = norm.replace(/[\s\r\n\t]+/g, " ");
  norm = norm.replace(/ي/g, "\u06CC");
  norm = norm.replace(/ك/g, "\u06A9");
  norm = norm.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?؛،]/g, "");
  norm = norm.replace(/\s+/g, " ");
  return norm.trim();
}
function sanitizeInput(text) {
  if (!text) return "";
  let cleaned = text.replace(/data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64,[a-zA-Z0-9+/=]+/gi, "[Base64/Binary Data Removed]");
  cleaned = cleaned.replace(/\b[a-zA-Z0-9+/]{40,}=*\b/g, "[Base64/Binary Data Removed]");
  return cleaned.trim();
}
function getAI(customApiKey) {
  const apiKey = customApiKey || globalServerApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please provide a valid Gemini API Key.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function callGemini(modelName, prompt, customApiKey) {
  const ai = getAI(customApiKey);
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  });
  if (!response || !response.text) {
    throw new Error("Empty response received from Gemini API");
  }
  return response.text;
}
async function analyzeWithFallback(prompt, fallbackLang, originalText, customApiKey) {
  const modelsToTry = [
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro"
  ];
  const maxRetriesPerModel = 1;
  let lastError = null;
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini API] Querying ${model} (attempt ${attempt}/${maxRetriesPerModel})...`);
        const responseText = await callGemini(model, prompt, customApiKey);
        let cleanedText = responseText.trim();
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        let parsed = JSON.parse(cleanedText.trim());
        if (Array.isArray(parsed)) {
          return { data: parsed, fromAI: true };
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.analysis)) return { data: parsed.analysis, fromAI: true };
          if (Array.isArray(parsed.fallacies)) return { data: parsed.fallacies, fromAI: true };
          if (Array.isArray(parsed.errors)) return { data: parsed.errors, fromAI: true };
          if (Array.isArray(parsed.results)) return { data: parsed.results, fromAI: true };
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key])) {
              return { data: parsed[key], fromAI: true };
            }
          }
          if (parsed.quote || parsed.errorName) {
            return { data: [parsed], fromAI: true };
          }
        }
        throw new Error("Response JSON structure could not be mapped to array");
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini API] Attempt failed for model ${model}:`, err.message || err);
        if (attempt < maxRetriesPerModel) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  }
  console.warn(`[Gemini API] Online API unavailable (${lastError?.message || lastError}). Seamlessly providing analysis via rule-based logic engine.`);
  return { data: runOfflineAnalysis(originalText, fallbackLang), fromAI: false };
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    console.log(`[Server Log] ${req.method} ${req.url}`);
    next();
  });
  app.use(import_express.default.json());
  app.post("/api/set-server-key", (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return res.status(400).json({ error: "Invalid API key provided" });
      }
      globalServerApiKey = apiKey.trim();
      process.env.GEMINI_API_KEY = apiKey.trim();
      import_fs.default.writeFileSync(SERVER_KEY_FILE, apiKey.trim(), "utf-8");
      console.log("[Server Log] Successfully updated globalServerApiKey and persisted to server_key.txt");
      return res.json({ success: true, message: "Global server API key updated successfully for all users!" });
    } catch (err) {
      console.error("[Server Log] Failed to update server key:", err);
      return res.status(500).json({ error: err.message || "Failed to set server key" });
    }
  });
  app.post("/api/analyze", async (req, res) => {
    console.log("[Server Log] Hit /api/analyze with body:", req.body);
    try {
      const { lang, customApiKey } = req.body;
      let { text } = req.body;
      text = sanitizeInput(text);
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided or text contained only invalid binary/base64 data" });
      }
      const isPersian = lang === "fa";
      const normalizedText = normalizeTextForCache(text);
      const cacheKey = `${lang || "fa"}_${normalizedText}`;
      if (analysisCache[cacheKey]) {
        console.log(`[Cache Log] Match found for key [${cacheKey}]! Instantly returning cached output.`);
        return res.json({ analysis: analysisCache[cacheKey] });
      }
      const apiKeyToUse = globalServerApiKey || process.env.GEMINI_API_KEY;
      if (!apiKeyToUse) {
        console.warn("[Server Log] No Gemini API key present. Providing seamless analysis using rule-based logic engine.");
        const fallbackResult = runOfflineAnalysis(text, isPersian ? "fa" : "en");
        return res.json({ analysis: fallbackResult, isOffline: true });
      }
      const prompt = `
You are an exceptionally rigorous, academic-grade pure logic analyzer and logical fallacy expert ("\u0645\u0646\u0637\u0642\u200C\u0633\u0646\u062C").
Your mandate is to perform a dual-layered evaluation of the user's text on a deep level of "pure reason" (\u0639\u0642\u0644 \u0645\u062D\u0636) with absolute conceptual precision:

LAYER 1: PURE RATIONALITY & SYSTEMATIC ERRORS
1. Category Mistakes (\u062E\u0637\u0627\u06CC \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC): Attributing properties, abilities, or physical capabilities to entities, faculties, or concepts that cannot logically or physically possess them (e.g., "The eye coordinates the hand" \u2014 only the mind/brain coordinates, the eye is merely a passive sensory receptor; or attributing physical mass/space to thoughts).
2. Logical Absurdities & Contradictions (\u062A\u0646\u0627\u0642\u0636\u200C\u0647\u0627\u06CC \u0639\u0642\u0644\u06CC \u0648 \u0641\u06CC\u0632\u06CC\u06A9\u06CC): Statements that lack rational consistency or violate the fundamental laws of logical coherence, definitions, or basic physical reality (e.g., claiming a square has circular properties, or assuming an effect occurred prior to its cause).
3. Invalid Syllogisms (\u0642\u06CC\u0627\u0633\u200C\u0647\u0627\u06CC \u0645\u0646\u0637\u0642\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631): Drawing a conclusion that does not follow from the premises, or establishing unrelated/non-sequitur connections between thoughts.

LAYER 2: COMPREHENSIVE FORMAL & INFORMAL FALLACIES (\u0627\u0646\u0648\u0627\u0639 \u0645\u063A\u0627\u0644\u0637\u0627\u062A \u0645\u0646\u0637\u0642\u06CC \u0635\u0648\u0631\u06CC \u0648 \u063A\u06CC\u0631\u0635\u0648\u0631\u06CC)
Analyze the text deeply to identify, flag, and name any standard logical fallacies, including but not limited to:
- Strawman (\u0645\u063A\u0627\u0644\u0637\u0647 \u067E\u0647\u0644\u0648\u0627\u0646\u200C\u067E\u0646\u0628\u0647): Distorting, oversimplifying, or misrepresenting the opponent's argument to make it easier to attack.
- Ad Hominem (\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0634\u062E\u0635 \u06CC\u0627 \u062D\u0645\u0644\u0647 \u0634\u062E\u0635\u06CC): Attacking the speaker's character, background, or personal qualities instead of addressing the validity of their argument.
- Circular Reasoning / Begging the Question (\u0645\u063A\u0627\u0644\u0637\u0647 \u0645\u0635\u0627\u062F\u0631\u0647 \u0628\u0647 \u0645\u0637\u0644\u0648\u0628 / \u0627\u0633\u062A\u062F\u0644\u0627\u0644 \u062F\u0627\u06CC\u0631\u0647\u200C\u0627\u06CC): Assuming the truth of the conclusion directly or indirectly within the premises.
- Hasty Generalization (\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0639\u0645\u06CC\u0645 \u0634\u062A\u0627\u0628\u200C\u0632\u062F\u0647): Reaching a broad conclusion based on a small, non-representative, or insufficient sample.
- False Dilemma / False Dichotomy (\u0645\u063A\u0627\u0644\u0637\u0647 \u062F\u0648\u0631\u0627\u0647\u06CC \u06A9\u0627\u0630\u0628 \u06CC\u0627 \u0633\u06CC\u0627\u0647 \u0648 \u0633\u0641\u06CC\u062F): Presenting only two extreme choices or alternatives when in fact more options exist.
- Appeal to Popularity / Bandwagon (\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0627\u06A9\u062B\u0631\u06CC\u062A / \u062A\u0648\u062F\u0647): Asserting that a claim is true or good simply because a majority of people believe or do it.
- False Cause / Post Hoc (\u0645\u063A\u0627\u0644\u0637\u0647 \u0639\u0644\u062A \u06A9\u0627\u0630\u0628 / \u0647\u0645\u0628\u0633\u062A\u06AF\u06CC \u062C\u0627\u06CC \u0639\u0644\u06CC\u062A): Assuming that because one event followed another, the first event must have caused the second.
- Slippery Slope (\u0645\u063A\u0627\u0644\u0637\u0647 \u0634\u06CC\u0628 \u0644\u063A\u0632\u0646\u062F\u0647): Claiming without sufficient evidence that a small first step will inevitably lead to a chain of catastrophic events.
- Appeal to Emotion (\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0627\u062D\u0633\u0627\u0633\u0627\u062A): Using emotional language, pity, fear, or anger to win an argument in the absence of solid rational proof.
- Appeal to False Authority (\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0648\u0633\u0644 \u0628\u0647 \u0645\u0631\u062C\u0639 \u06A9\u0627\u0630\u0628): Citing an irrelevant, vague, or unqualified source or authority to back up an argument.
- Equivocation (\u0645\u063A\u0627\u0644\u0637\u0647 \u0627\u0634\u062A\u0631\u0627\u06A9 \u0644\u0641\u0638): Using a key term or phrase in an ambiguous way, with one meaning in one portion of the argument and another meaning in another portion.
- Poisoning the Well (\u0645\u063A\u0627\u0644\u0637\u0647 \u062A\u0644\u0647\u200C\u06AF\u0630\u0627\u0631\u06CC / \u0645\u0633\u0645\u0648\u0645 \u06A9\u0631\u062F\u0646 \u0686\u0627\u0647): Preemptively presenting adverse information about a target to discredit everything they say beforehand.

IMPORTANT INSTRUCTIONS:
- Be highly rigorous. Do NOT let conversational metaphors slip by if they are presented as literal logical arguments, but distinguish artistic expression from actual logical claims. Only flag genuine flaws in reasoning, conceptual boundaries, or physical realities.
- Please return a perfectly formatted JSON array containing objects for each logical error/fallacy detected. If no errors are found, return an empty array [].
- Do NOT wrap the JSON in Markdown formatting blocks (e.g. \`\`\`json). Just return the raw JSON array.

Each object must contain exactly:
1. "quote": The exact flawed segment or sentence from the text.
2. "errorName": The exact type or name of the logical fallacy/error (in ${isPersian ? "Persian" : "English"}). For example, "\u062E\u0637\u0627\u06CC \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC" (Category Mistake) or "\u0645\u063A\u0627\u0644\u0637\u0647 \u067E\u0647\u0644\u0648\u0627\u0646\u200C\u067E\u0646\u0628\u0647" (Strawman Fallacy).
3. "explanation": A clear, educational, and elegant rational explanation of why it is logically/conceptually flawed (in ${isPersian ? "Persian" : "English"}). Make this explanation friendly, highly educational, analytical, and easy to read.

Here is the user text to evaluate:
"${text}"
      `;
      const { data: analysisResult, fromAI } = await analyzeWithFallback(prompt, isPersian ? "fa" : "en", text, apiKeyToUse);
      if (fromAI) {
        analysisCache[cacheKey] = analysisResult;
        saveCache();
      }
      res.json({ analysis: analysisResult, isOffline: !fromAI });
    } catch (error) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during analysis" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
