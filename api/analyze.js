// Vercel Serverless Function: POST /api/analyze
// Gemini is primary; Groq is used automatically if Gemini is unavailable.
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

function parseArray(raw) {
  const cleaned = String(raw || "").trim().replace(/^```(?:json)?s*/i, "").replace(/s*```$/, "");
  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.analysis)) return parsed.analysis;
  if (parsed && Array.isArray(parsed.fallacies)) return parsed.fallacies;
  throw new Error("AI response was not a JSON array");
}

function buildPrompt(text, lang) {
  const isFa = lang === "fa";
  return `
You are an exceptionally rigorous, academic-grade pure logic analyzer and logical fallacy expert ("منطق‌سنج").
Evaluate the submitted text on two layers:
1. Pure rationality: category mistakes, logical/physical contradictions, invalid syllogisms and non-sequiturs.
2. Formal and informal fallacies, including strawman, ad hominem, circular reasoning, hasty generalization, false dilemma, appeal to popularity, false cause, slippery slope, appeal to emotion, false authority, equivocation, and poisoning the well.

Be rigorous. Distinguish artistic metaphors from literal claims. Only flag genuine flaws in reasoning, concepts, or physical reality.
Return ONLY a valid JSON array. If no errors are found, return [].
Each object must contain exactly:
- "quote": exact flawed segment from the text.
- "errorName": name of the error in ${isFa ? "Persian" : "English"}.
- "explanation": clear, educational explanation in ${isFa ? "Persian" : "English"}.

Text to evaluate:
<USER_TEXT>
${text}
</USER_TEXT>
`;
}

async function callGemini(prompt, apiKey) {
  const models = ["gemini-flash-latest", "gemini-2.5-flash"];
  let lastError;
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);
      const output = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
      if (!output) throw new Error("Gemini returned an empty response");
      return parseArray(output);
    } catch (error) {
      lastError = error;
      console.error(`Gemini model ${model} failed:`, error.message);
    }
  }
  throw lastError || new Error("Gemini unavailable");
}

async function callGroq(prompt, apiKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "You are a rigorous logical fallacy analyzer. Follow the user's output schema exactly." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Groq HTTP ${response.status}`);
  const output = data.choices?.[0]?.message?.content;
  if (!output) throw new Error("Groq returned an empty response");
  return parseArray(output);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, lang } = req.body || {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "No text provided" });
    }
    if (text.length > 30000) {
      return res.status(413).json({ error: "Text is too long (maximum 30,000 characters)." });
    }

    const prompt = buildPrompt(text.trim(), lang === "fa" ? "fa" : "en");
    const errors = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const analysis = await callGemini(prompt, process.env.GEMINI_API_KEY);
        return res.status(200).json({ analysis, provider: "gemini" });
      } catch (error) {
        errors.push(`Gemini: ${error.message}`);
        console.warn("Gemini unavailable; switching to Groq.", error.message);
      }
    } else {
      errors.push("GEMINI_API_KEY is not configured");
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const analysis = await callGroq(prompt, process.env.GROQ_API_KEY);
        return res.status(200).json({ analysis, provider: "groq" });
      } catch (error) {
        errors.push(`Groq: ${error.message}`);
      }
    } else {
      errors.push("GROQ_API_KEY is not configured");
    }

    return res.status(503).json({
      error: "هر دو سرویس هوش مصنوعی در دسترس نیستند. " + errors.join(" | ")
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return res.status(500).json({ error: error.message || "Analysis failed" });
  }
}
