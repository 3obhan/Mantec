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
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new import_genai.GoogleGenAI({ apiKey });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    console.log(`[Server Log] ${req.method} ${req.url}`);
    next();
  });
  app.use(import_express.default.json());
  app.post("/api/analyze", async (req, res) => {
    console.log("[Server Log] Hit /api/analyze with body:", req.body);
    try {
      const { text, lang } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided" });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server missing Gemini API Key. Please configure it in the UI." });
      }
      const isPersian = lang === "fa";
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
      const models = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-2.5-flash"];
      let apiResponse = null;
      let lastError = null;
      for (const model of models) {
        try {
          const response = await getAI().models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              temperature: 0.2,
              // Low temperature for high logical consistency
              responseMimeType: "application/json"
            }
          });
          if (response && response.text) {
            apiResponse = response;
            break;
          }
        } catch (e) {
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
        parsed = [];
      }
      res.json({ analysis: parsed });
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
