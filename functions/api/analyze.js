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

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let geminiResponse = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[Cloudflare Function] Querying model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          geminiResponse = response;
          break; // Stop trying if we have a successful response
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
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        }
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
