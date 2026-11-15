import { json, randomToken, sha256, originOf } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "D1 database binding DB is missing" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { provider, report } = body || {};
  if (!["zibal", "stripe"].includes(provider)) return json({ error: "Unsupported payment provider" }, 400);
  if (!report || typeof report.text !== "string" || !report.text.trim() ||
      !Array.isArray(report.fallacies) || !["fa", "en"].includes(report.lang) ||
      report.text.length > 30000 || report.fallacies.length > 150 ||
      JSON.stringify(report).length > 180000) return json({ error: "Invalid or oversized report" }, 400);

  const orderId = crypto.randomUUID();
  const accessToken = randomToken();
  const tokenHash = await sha256(accessToken);
  const reportJson = JSON.stringify({ text: report.text, fallacies: report.fallacies, lang: report.lang });
  const origin = originOf(request);
  let providerRef, checkoutUrl, amount, currency;

  if (provider === "zibal") {
    if (!env.ZIBAL_MERCHANT || !env.PDF_PRICE_TOMAN) return json({ error: "Zibal secrets/settings are missing in Cloudflare Pages" }, 503);
    const toman = Number(env.PDF_PRICE_TOMAN);
    if (!Number.isSafeInteger(toman) || toman < 1000) return json({ error: "Invalid PDF_PRICE_TOMAN" }, 500);
    amount = toman * 10; currency = "IRR";
    const callback = new URL("/api/payment/zibal-callback", origin);
    callback.searchParams.set("orderId", orderId);
    const res = await fetch("https://gateway.zibal.ir/v1/request", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant: env.ZIBAL_MERCHANT, amount, callbackUrl: callback.toString(), description: "Mantec Full PDF Report", orderId })
    });
    const data = await res.json();
    if (data.result !== 100 || !data.trackId) return json({ error: data.message || "Zibal request failed" }, 502);
    providerRef = String(data.trackId);
    checkoutUrl = "https://gateway.zibal.ir/start/" + encodeURIComponent(providerRef);
  } else {
    if (!env.STRIPE_SECRET_KEY) return json({ error: "STRIPE_SECRET_KEY is missing in Cloudflare Pages" }, 503);
    amount = 100; currency = "USD";
    const form = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": "100",
      "line_items[0][price_data][product_data][name]": "Mantec Full PDF Report",
      "line_items[0][quantity]": "1",
      client_reference_id: orderId,
      "metadata[orderId]": orderId,
      "payment_intent_data[metadata][orderId]": orderId,
      success_url: new URL("/#/analyze?payment=success&orderId=" + orderId, origin).toString(),
      cancel_url: new URL("/#/analyze?payment=cancelled&orderId=" + orderId, origin).toString()
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST", headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY, "content-type": "application/x-www-form-urlencoded" }, body: form
    });
    const session = await res.json();
    if (!res.ok || !session.id || !session.url) return json({ error: session.error?.message || "Stripe checkout failed" }, 502);
    providerRef = session.id; checkoutUrl = session.url;
  }

  await env.DB.prepare(`INSERT INTO payments
    (id, provider, status, amount, currency, provider_ref, created_at, report_json, access_token_hash)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`)
    .bind(orderId, provider, amount, currency, providerRef, new Date().toISOString(), reportJson, tokenHash).run();
  return json({ orderId, accessToken, checkoutUrl });
}
