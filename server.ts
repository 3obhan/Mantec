import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
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

  // API Route for logical analysis
  app.post("/api/analyze", async (req, res) => {
    console.log("[Server Log] Hit /api/analyze with body:", req.body);
    try {
      const { text, lang } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "No text provided" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server missing Gemini API Key. Please configure it in the UI." });
      }

      const isPersian = lang === 'fa';

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

      const models = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-2.5-flash'];
      let apiResponse = null;
      let lastError = null;

      for (const model of models) {
        try {
          const response = await getAI().models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              temperature: 0.2, // Low temperature for high logical consistency
              responseMimeType: "application/json",
            }
          });
          if (response && response.text) {
            apiResponse = response;
            break;
          }
        } catch (e: any) {
          lastError = `Model ${model} failed: ${e.message}`;
          console.warn(lastError);
        }
      }

      if (!apiResponse) {
        throw new Error(`All models failed or returned empty results. Last error: ${lastError}`);
      }

      const resultText = apiResponse.text || "[]";
      let parsed = [];
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        // Fallback if parsing fails
        parsed = [];
      }

      res.json({ analysis: parsed });

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
