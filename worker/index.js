const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
const uuid = () => crypto.randomUUID();
const encoder = new TextEncoder();
const sha256 = async value => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
};
const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/payment/create" && request.method === "POST") return await createPayment(request, env);
      if (url.pathname === "/api/payment/status" && request.method === "GET") return await paymentStatus(url, env);
      if (url.pathname === "/api/payment/report" && request.method === "GET") return await paidReport(url, env);
      if (url.pathname === "/api/payment/zibal-callback" && request.method === "GET") return await zibalCallback(url, env);
      if (url.pathname === "/api/payment/stripe-webhook" && request.method === "POST") return await stripeWebhook(request, env);
      if (url.pathname === "/api/payment/health" && request.method === "GET") return json({ ok: true, service: "mantec-payments" });
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Mantec Worker is running. Configure the ASSETS binding for the website.", { status: 200 });
    } catch (error) {
      console.error("Payment Worker error:", error);
      return json({ error: "Payment service error" }, 500);
    }
  }
};

async function createPayment(request, env) {
  if (!env.DB || !env.APP_ORIGIN) return json({ error: "Payment service is not configured" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const { provider, report } = body || {};
  if (!["zibal", "stripe"].includes(provider)) return json({ error: "Unsupported payment provider" }, 400);
  if (!report || typeof report.text !== "string" || !Array.isArray(report.fallacies) || !["fa", "en"].includes(report.lang)) {
    return json({ error: "A valid report (text, fallacies, lang) is required" }, 400);
  }
  if (!report.text.trim() || report.text.length > 30000 || report.fallacies.length > 150 ||
      JSON.stringify(report).length > 180000) return json({ error: "Report is empty or exceeds the allowed size" }, 413);

  const orderId = uuid();
  const accessToken = randomToken();
  const tokenHash = await sha256(accessToken);
  const reportJson = JSON.stringify({ text: report.text, fallacies: report.fallacies, lang: report.lang });
  const createdAt = new Date().toISOString();
  const origin = new URL(env.APP_ORIGIN).origin;
  let providerRef, checkoutUrl, amount, currency;

  if (provider === "zibal") {
    if (!env.ZIBAL_MERCHANT || !env.PDF_PRICE_TOMAN) return json({ error: "Zibal is not configured" }, 503);
    const toman = Number(env.PDF_PRICE_TOMAN);
    if (!Number.isSafeInteger(toman) || toman < 1000 || toman > 1000000000) return json({ error: "Invalid PDF_PRICE_TOMAN setting" }, 500);
    amount = toman * 10;
    currency = "IRR";
    const callbackUrl = new URL("/api/payment/zibal-callback", origin);
    callbackUrl.searchParams.set("orderId", orderId);
    const response = await fetch("https://gateway.zibal.ir/v1/request", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant: env.ZIBAL_MERCHANT, amount, callbackUrl: callbackUrl.toString(), description: "Mantec full PDF report", orderId })
    });
    const data = await response.json();
    if (data.result !== 100 || !data.trackId) return json({ error: data.message || "Zibal request failed" }, 502);
    providerRef = String(data.trackId);
    checkoutUrl = "https://gateway.zibal.ir/start/" + encodeURIComponent(providerRef);
  } else {
    if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe is not configured" }, 503);
    amount = 100;
    currency = "USD";
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][price_data][currency]", "usd");
    form.set("line_items[0][price_data][unit_amount]", "100");
    form.set("line_items[0][price_data][product_data][name]", "Mantec Full PDF Report");
    form.set("line_items[0][quantity]", "1");
    form.set("client_reference_id", orderId);
    form.set("metadata[orderId]", orderId);
    form.set("payment_intent_data[metadata][orderId]", orderId);
    form.set("success_url", new URL("/#/analyze?payment=success&orderId=" + orderId, origin).toString());
    form.set("cancel_url", new URL("/#/analyze?payment=cancelled&orderId=" + orderId, origin).toString());
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST", headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY, "content-type": "application/x-www-form-urlencoded" }, body: form
    });
    const session = await response.json();
    if (!response.ok || !session.id || !session.url) return json({ error: session.error?.message || "Stripe checkout creation failed" }, 502);
    providerRef = session.id;
    checkoutUrl = session.url;
  }

  await env.DB.prepare(`INSERT INTO payments
    (id, provider, status, amount, currency, provider_ref, created_at, report_json, access_token_hash)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`)
    .bind(orderId, provider, amount, currency, providerRef, createdAt, reportJson, tokenHash).run();

  return json({ orderId, accessToken, checkoutUrl });
}

async function paymentStatus(url, env) {
  const orderId = url.searchParams.get("orderId");
  if (!orderId || !env.DB) return json({ error: "orderId is required" }, 400);
  const row = await env.DB.prepare("SELECT status, provider FROM payments WHERE id = ?").bind(orderId).first();
  if (!row) return json({ error: "Order not found" }, 404);
  return json({ orderId, status: row.status, provider: row.provider });
}

async function paidReport(url, env) {
  const orderId = url.searchParams.get("orderId");
  const token = url.searchParams.get("token");
  if (!orderId || !token || token.length !== 64 || !env.DB) return json({ error: "Valid order credentials are required" }, 400);
  const row = await env.DB.prepare("SELECT status, report_json, access_token_hash FROM payments WHERE id = ?").bind(orderId).first();
  if (!row || await sha256(token) !== row.access_token_hash) return json({ error: "Report access denied" }, 403);
  if (row.status !== "paid") return json({ error: "Payment has not been confirmed" }, 402);
  if (!row.report_json) return json({ error: "Report is no longer available" }, 410);
  return json({ report: JSON.parse(row.report_json) });
}

async function zibalCallback(url, env) {
  const orderId = url.searchParams.get("orderId");
  const trackId = url.searchParams.get("trackId");
  if (!orderId || !trackId || !env.DB || !env.ZIBAL_MERCHANT) return new Response("Invalid payment callback", { status: 400 });
  const row = await env.DB.prepare("SELECT amount, provider_ref, status FROM payments WHERE id = ? AND provider = 'zibal'").bind(orderId).first();
  if (!row || String(row.provider_ref) !== String(trackId)) return new Response("Order not found", { status: 404 });
  if (row.status !== "paid") {
    const response = await fetch("https://gateway.zibal.ir/v1/verify", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant: env.ZIBAL_MERCHANT, trackId: Number(trackId) })
    });
    const result = await response.json();
    if (result.result === 100 && Number(result.amount) === Number(row.amount)) {
      await env.DB.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'pending'")
        .bind(new Date().toISOString(), orderId).run();
    } else if (result.result !== 201) {
      await env.DB.prepare("UPDATE payments SET status = 'failed' WHERE id = ? AND status = 'pending'").bind(orderId).run();
    }
  }
  return Response.redirect(new URL("/#/analyze?payment=return&orderId=" + encodeURIComponent(orderId), env.APP_ORIGIN).toString(), 303);
}

async function stripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.DB) return json({ error: "Stripe webhook is not configured" }, 503);
  const raw = await request.text();
  if (!await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)) return json({ error: "Invalid Stripe signature" }, 400);
  const event = JSON.parse(raw);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (orderId && session.payment_status === "paid" && Number(session.amount_total) === 100 && session.currency === "usd") {
      await env.DB.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ? AND provider = 'stripe' AND provider_ref = ? AND amount = 100 AND currency = 'USD' AND status = 'pending'")
        .bind(new Date().toISOString(), orderId, session.id).run();
    }
  }
  return json({ received: true });
}

async function verifyStripeSignature(payload, header, secret) {
  if (!header) return false;
  const fields = header.split(",").map(part => part.trim().split("="));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "." + payload));
  const expected = [...new Uint8Array(signed)].map(b => b.toString(16).padStart(2, "0")).join("");
  return signatures.some(signature => {
    if (signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    return diff === 0;
  });
}
