import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for logical analysis
  app.post("/api/analyze", async (req, res) => {
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
You are a highly rigorous, academic-grade pure logic analyzer ("منطک"). Your mandate is to analyze the user's text for any of the following logical, cognitive, or raw rational flaws:

1. Category Mistakes (خطای دسته‌بندی): Attributing properties, abilities, or physical capabilities to entities, faculties, or concepts that cannot logically or physically possess them (for example, saying an eye literally "coordinates/grabs a hand", or that thoughts possess physical mass). If a statement represents a literal physical or logical impossibility under rational inspection, flag it clearly.
2. Formal & Informal Fallacies (انواع مغالطات منطقی): circular logic, hasty generalization, strawman arguments, ad hominem attacks, false dichotomies, etc.
3. Logical Absurdities (تناقض‌های عقلی و فیزیکی): Statements that lack rational consistency or violate the basic rules of logical coherence and physical reality.

Analyze the user's text on a deep level of "pure reason" (عقل محض).
Please return a perfectly formatted JSON array containing objects for each logical error detected. If no errors are found, return an empty array [].
Do NOT wrap the JSON in Markdown formatting blocks (e.g. \`\`\`json). Just return the raw JSON array.

Each object must contain exactly:
1. "quote": The exact flawed segment or sentence from the text.
2. "errorName": The exact type or name of the logical fallacy/error (in ${isPersian ? 'Persian' : 'English'}). For example, "خطای دسته‌بندی" (Category Mistake).
3. "explanation": A clear, educational, and elegant rational explanation of why it is logically/conceptually flawed (in ${isPersian ? 'Persian' : 'English'}). Make this explanation friendly, clear, and easy to read.

Here is the user text to evaluate:
"${text}"
      `;

      const models = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-2.5-flash'];
      let apiResponse = null;
      let lastError = null;

      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
