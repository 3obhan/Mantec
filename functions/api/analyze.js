export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { text, lang } = await request.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server missing Gemini API Key. Please configure GEMINI_API_KEY in your Cloudflare Pages dashboard environment variables." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const isPersian = lang === 'fa';

    const prompt = `
You are a highly rigorous, academic-grade pure logic analyzer ("منطق"). Your mandate is to analyze the user's text for any of the following logical, cognitive, or raw rational flaws:

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
    let geminiResponse = null;
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          geminiResponse = response;
          break;
        } else {
          const errText = await response.text();
          lastError = `Model ${model} failed with status ${response.status}: ${errText}`;
          console.warn(lastError);
        }
      } catch (e) {
        lastError = `Model ${model} threw error: ${e.message}`;
        console.warn(lastError);
      }
    }

    if (!geminiResponse) {
      return new Response(JSON.stringify({ error: `Gemini API Error: All models are currently under heavy load or unavailable. Please try again in a few moments. (Details: ${lastError})` }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    const geminiData = await geminiResponse.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    let parsed = [];
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      parsed = [];
    }

    return new Response(JSON.stringify({ analysis: parsed }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "An error occurred during analysis" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}
