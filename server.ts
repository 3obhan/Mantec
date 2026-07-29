import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { runOfflineAnalysis } from "./src/offlineAnalyzer";

dotenv.config();

// File-based persistent cache to avoid duplicate API calls for identical texts
const CACHE_FILE = path.join(process.cwd(), "analysis_cache.json");
const SERVER_KEY_FILE = path.join(process.cwd(), "server_key.txt");

// Persistent global server-level API key for all incoming requests (Web, iOS, Android)
let globalServerApiKey = process.env.GEMINI_API_KEY || '';

try {
  if (fs.existsSync(SERVER_KEY_FILE)) {
    const savedKey = fs.readFileSync(SERVER_KEY_FILE, "utf-8").trim();
    if (savedKey) {
      globalServerApiKey = savedKey;
      console.log("[Server Log] Loaded persistent global server API Key from server_key.txt");
    }
  }
} catch (err) {
  console.error("[Server Log] Failed to load server_key.txt:", err);
}

let analysisCache: Record<string, any> = {};

try {
  if (fs.existsSync(CACHE_FILE)) {
    analysisCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    console.log(`[Cache] Loaded ${Object.keys(analysisCache).length} cached analyses.`);
  }
} catch (err) {
  console.error("[Cache] Failed to load cache file:", err);
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(analysisCache, null, 2), "utf-8");
  } catch (err) {
    console.error("[Cache] Failed to save cache file:", err);
  }
}

// Helper to normalize text for caching to ensure identical inputs match even with minor formatting/punctuation/character differences
function normalizeTextForCache(text: string): string {
  if (!text) return "";
  let norm = text.trim().toLowerCase();
  // Standardize multiple spacing/newlines
  norm = norm.replace(/[\s\r\n\t]+/g, " ");
  // Standardize common Farsi/Arabic letter variations
  norm = norm.replace(/ي/g, "ی");
  norm = norm.replace(/ك/g, "ک");
  // Strip common punctuations to make matching highly resilient to small edits/marks
  norm = norm.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?؛،]/g, "");
  // Standardize spacing again after punctuation stripping
  norm = norm.replace(/\s+/g, " ");
  return norm.trim();
}

// Sanitizes the input text by stripping out any data URIs, base64 strings, or large binary chunks
function sanitizeInput(text: string): string {
  if (!text) return "";
  
  // 1. Remove data URIs (e.g., data:image/png;base64,...)
  let cleaned = text.replace(/data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64,[a-zA-Z0-9+/=]+/gi, '[Base64/Binary Data Removed]');
  
  // 2. Remove raw long base64/hex blocks (e.g., 40+ characters of uninterrupted alphanumeric/plus/slash/equal characters)
  cleaned = cleaned.replace(/\b[a-zA-Z0-9+/]{40,}=*\b/g, '[Base64/Binary Data Removed]');
  
  return cleaned.trim();
}

function getAI(customApiKey?: string) {
  const apiKey = customApiKey || globalServerApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please provide a valid Gemini API Key.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper to call a specific Gemini model with deterministic configuration
async function callGemini(modelName: string, prompt: string, customApiKey?: string): Promise<string> {
  const ai = getAI(customApiKey);
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });
  
  if (!response || !response.text) {
    throw new Error("Empty response received from Gemini API");
  }
  return response.text;
}

// Resilient analyzer with retries across models and seamless rule-based fallback for unlimited usage
async function analyzeWithFallback(prompt: string, fallbackLang: 'fa' | 'en', originalText: string, customApiKey?: string): Promise<{ data: any[]; fromAI: boolean }> {
  const modelsToTry = [
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-pro"
  ];
  const maxRetriesPerModel = 1;
  let lastError: any = null;

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
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.analysis)) return { data: parsed.analysis, fromAI: true };
          if (Array.isArray(parsed.fallacies)) return { data: parsed.fallacies, fromAI: true };
          if (Array.isArray(parsed.errors)) return { data: parsed.errors, fromAI: true };
          if (Array.isArray(parsed.results)) return { data: parsed.results, fromAI: true };
          
          // Find any key in the object that is an array
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key])) {
              return { data: parsed[key], fromAI: true };
            }
          }
          // If single object returned representing one error
          if (parsed.quote || parsed.errorName) {
            return { data: [parsed], fromAI: true };
          }
        }
        throw new Error("Response JSON structure could not be mapped to array");
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Attempt failed for model ${model}:`, err.message || err);
        
        if (attempt < maxRetriesPerModel) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  }

  // If online models fail or quota exhausted (429), fall back to rule-based logic engine for uninterrupted unlimited service
  console.warn(`[Gemini API] Online API unavailable (${lastError?.message || lastError}). Seamlessly providing analysis via rule-based logic engine.`);
  return { data: runOfflineAnalysis(originalText, fallbackLang), fromAI: false };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request logger middleware
  app.use((req, res, next) => {
    console.log(`[Server Log] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // API Route to set global server Gemini API Key for all users
  app.post("/api/set-server-key", (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        return res.status(400).json({ error: "Invalid API key provided" });
      }
      globalServerApiKey = apiKey.trim();
      process.env.GEMINI_API_KEY = apiKey.trim();
      fs.writeFileSync(SERVER_KEY_FILE, apiKey.trim(), "utf-8");
      console.log("[Server Log] Successfully updated globalServerApiKey and persisted to server_key.txt");
      return res.json({ success: true, message: "Global server API key updated successfully for all users!" });
    } catch (err: any) {
      console.error("[Server Log] Failed to update server key:", err);
      return res.status(500).json({ error: err.message || "Failed to set server key" });
    }
  });

  // API Route for logical analysis
  app.post("/api/analyze", async (req, res) => {
    console.log("[Server Log] Hit /api/analyze with body:", req.body);
    try {
      const { lang, customApiKey } = req.body;
      let { text } = req.body;
      
      text = sanitizeInput(text);
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "No text provided or text contained only invalid binary/base64 data" });
      }

      const isPersian = lang === 'fa';
      const normalizedText = normalizeTextForCache(text);
      const cacheKey = `${lang || 'fa'}_${normalizedText}`;

      // 1. Check persistent cache for instant, 100% identical and free results
      if (analysisCache[cacheKey]) {
        console.log(`[Cache Log] Match found for key [${cacheKey}]! Instantly returning cached output.`);
        return res.json({ analysis: analysisCache[cacheKey] });
      }

      const apiKeyToUse = globalServerApiKey || process.env.GEMINI_API_KEY;

      if (!apiKeyToUse) {
        console.warn("[Server Log] No Gemini API key present. Providing seamless analysis using rule-based logic engine.");
        const fallbackResult = runOfflineAnalysis(text, isPersian ? 'fa' : 'en');
        return res.json({ analysis: fallbackResult, isOffline: true });
      }

      const prompt = `
You are an exceptionally rigorous, academic-grade pure logic analyzer and logical fallacy expert ("منطق‌سنج").
Your mandate is to perform a dual-layered evaluation of the user's text on a deep level of "pure reason" (عقل محض) with absolute conceptual precision:

LAYER 1: PURE RATIONALITY & SYSTEMATIC ERRORS
1. Category Mistakes (خطای دسته‌بندی): Attributing properties, abilities, or physical capabilities to entities, faculties, or concepts that cannot logically or physically possess them (e.g., "The eye coordinates the hand" — only the mind/brain coordinates, the eye is merely a passive sensory receptor; or attributing physical mass/space to thoughts).
2. Logical Absurdities & Contradictions (تناقض‌های عقلی و فیزیکی): Statements that lack rational consistency or violate the fundamental laws of logical coherence, definitions, or basic physical reality (e.g., claiming a square has circular properties, or assuming an effect occurred prior to its cause).
3. Invalid Syllogisms (قیاس‌های منطقی نامعتبر): Drawing a conclusion that does not follow from the premises, or establishing unrelated/non-sequitur connections between thoughts.

LAYER 2: COMPREHENSIVE FORMAL & INFORMAL FALLACIES (انواع مغالطات منطقی صوری و غیرصوری)
Analyze the text deeply to identify, flag, and name any standard logical fallacies, including but not limited to:
- Strawman (مغالطه پهلوان‌پنبه): Distorting, oversimplifying, or misrepresenting the opponent's argument to make it easier to attack.
- Ad Hominem (مغالطه توسل به شخص یا حمله شخصی): Attacking the speaker's character, background, or personal qualities instead of addressing the validity of their argument.
- Circular Reasoning / Begging the Question (مغالطه مصادره به مطلوب / استدلال دایره‌ای): Assuming the truth of the conclusion directly or indirectly within the premises.
- Hasty Generalization (مغالطه تعمیم شتاب‌زده): Reaching a broad conclusion based on a small, non-representative, or insufficient sample.
- False Dilemma / False Dichotomy (مغالطه دوراهی کاذب یا سیاه و سفید): Presenting only two extreme choices or alternatives when in fact more options exist.
- Appeal to Popularity / Bandwagon (مغالطه توسل به اکثریت / توده): Asserting that a claim is true or good simply because a majority of people believe or do it.
- False Cause / Post Hoc (مغالطه علت کاذب / همبستگی جای علیت): Assuming that because one event followed another, the first event must have caused the second.
- Slippery Slope (مغالطه شیب لغزنده): Claiming without sufficient evidence that a small first step will inevitably lead to a chain of catastrophic events.
- Appeal to Emotion (مغالطه توسل به احساسات): Using emotional language, pity, fear, or anger to win an argument in the absence of solid rational proof.
- Appeal to False Authority (مغالطه توسل به مرجع کاذب): Citing an irrelevant, vague, or unqualified source or authority to back up an argument.
- Equivocation (مغالطه اشتراک لفظ): Using a key term or phrase in an ambiguous way, with one meaning in one portion of the argument and another meaning in another portion.
- Poisoning the Well (مغالطه تله‌گذاری / مسموم کردن چاه): Preemptively presenting adverse information about a target to discredit everything they say beforehand.

IMPORTANT INSTRUCTIONS:
- Be highly rigorous. Do NOT let conversational metaphors slip by if they are presented as literal logical arguments, but distinguish artistic expression from actual logical claims. Only flag genuine flaws in reasoning, conceptual boundaries, or physical realities.
- Please return a perfectly formatted JSON array containing objects for each logical error/fallacy detected. If no errors are found, return an empty array [].
- Do NOT wrap the JSON in Markdown formatting blocks (e.g. \`\`\`json). Just return the raw JSON array.

Each object must contain exactly:
1. "quote": The exact flawed segment or sentence from the text.
2. "errorName": The exact type or name of the logical fallacy/error (in ${isPersian ? 'Persian' : 'English'}). For example, "خطای دسته‌بندی" (Category Mistake) or "مغالطه پهلوان‌پنبه" (Strawman Fallacy).
3. "explanation": A clear, educational, and elegant rational explanation of why it is logically/conceptually flawed (in ${isPersian ? 'Persian' : 'English'}). Make this explanation friendly, highly educational, analytical, and easy to read.

Here is the user text to evaluate:
"${text}"
      `;

      // 2. Perform the analysis with rich fallback capability using provided key
      const { data: analysisResult, fromAI } = await analyzeWithFallback(prompt, isPersian ? 'fa' : 'en', text, apiKeyToUse);

      // 3. Store result in local cache ONLY if obtained from genuine AI model
      if (fromAI) {
        analysisCache[cacheKey] = analysisResult;
        saveCache();
      }

      res.json({ analysis: analysisResult, isOffline: !fromAI });

    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during analysis" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
