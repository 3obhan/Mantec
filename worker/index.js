const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
const uuid = () => crypto.randomUUID();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    try {
      if (url.pathname === "/api/payment/create" && request.method === "POST") return createPayment(request, env);
      if (url.pathname === "/api/payment/status" && request.method === "GET") return paymentStatus(url, env);
      if (url.pathname === "/api/payment/zibal-callback" && request.method === "GET") return zibalCallback(url, env);
      if (url.pathname === "/api/payment/stripe-webhook" && request.method === "POST") return stripeWebhook(request, env);
      if (url.pathname === "/api/payment/health") return json({ ok: true, service: "mantec-payments" });
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Mantec Worker is running. Configure the ASSETS binding for the website.", { status: 200 });
    } catch (error) {
      console.error("Payment Worker error:", error);
      return json({ error: "Payment service error" }, 500);
    }
  }
};

async function createPayment(request, env) {
  const body = await request.json();
  const provider = body.provider;
  if (!["zibal", "stripe"].includes(provider)) return json({ error: "Unsupported payment provider" }, 400);
  if (!env.DB || !env.APP_ORIGIN) return json({ error: "Worker is not configured: DB and APP_ORIGIN are required" }, 503);

  const orderId = uuid();
  const createdAt = new Date().toISOString();
  const origin = new URL(env.APP_ORIGIN).origin;

  if (provider === "zibal") {
    if (!env.ZIBAL_MERCHANT || !env.PDF_PRICE_TOMAN) return json({ error: "Zibal is not configured" }, 503);
    const toman = Number(env.PDF_PRICE_TOMAN);
    if (!Number.isSafeInteger(toman) || toman < 1000) return json({ error: "Invalid Zibal price configuration" }, 500);
    const rial = toman * 10;
    const callbackUrl = new URL("/api/payment/zibal-callback", origin);
    callbackUrl.searchParams.set("orderId", orderId);
    const response = await fetch("https://gateway.zibal.ir/v1/request", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant: env.ZIBAL_MERCHANT, amount: rial, callbackUrl: callbackUrl.toString(), description: "Mantec full PDF report", orderId })
    });
    const data = await response.json();
    if (data.result !== 100 || !data.trackId) return json({ error: data.message || "Zibal request failed" }, 502);
    await env.DB.prepare("INSERT INTO payments (id, provider, status, amount, currency, provider_ref, created_at) VALUES (?, 'zibal', 'pending', ?, 'IRR', ?, ?)")
      .bind(orderId, rial, String(data.trackId), createdAt).run();
    return json({ orderId, checkoutUrl: "https://gateway.zibal.ir/start/" + encodeURIComponent(data.trackId) });
  }

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) return json({ error: "Stripe is not configured" }, 503);
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price]", env.STRIPE_PRICE_ID);
  form.set("line_items[0][quantity]", "1");
  form.set("client_reference_id", orderId);
  form.set("metadata[orderId]", orderId);
  form.set("success_url", new URL("/#/analyze?payment=success&orderId=" + orderId, origin).toString());
  form.set("cancel_url", new URL("/#/analyze?payment=cancelled&orderId=" + orderId, origin).toString());
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY, "content-type": "application/x-www-form-urlencoded" },
    body: form
  });
  const session = await response.json();
  if (!response.ok || !session.id || !session.url) return json({ error: session.error?.message || "Stripe checkout creation failed" }, 502);
  await env.DB.prepare("INSERT INTO payments (id, provider, status, amount, currency, provider_ref, created_at) VALUES (?, 'stripe', 'pending', 0, 'USD', ?, ?)")
    .bind(orderId, session.id, createdAt).run();
  return json({ orderId, checkoutUrl: session.url });
}

async function paymentStatus(url, env) {
  const orderId = url.searchParams.get("orderId");
  if (!orderId || !env.DB) return json({ error: "orderId is required" }, 400);
  const row = await env.DB.prepare("SELECT status, provider FROM payments WHERE id = ?").bind(orderId).first();
  if (!row) return json({ error: "Order not found" }, 404);
  return json({ orderId, status: row.status, provider: row.provider });
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
    } else {
      await env.DB.prepare("UPDATE payments SET status = 'failed' WHERE id = ? AND status = 'pending'").bind(orderId).run();
    }
  }
  return Response.redirect(new URL("/#/analyze?payment=return&orderId=" + encodeURIComponent(orderId), env.APP_ORIGIN).toString(), 303);
}

async function stripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.DB) return json({ error: "Stripe webhook is not configured" }, 503);
  const signature = request.headers.get("stripe-signature");
  const raw = await request.text();
  if (!await verifyStripeSignature(raw, signature, env.STRIPE_WEBHOOK_SECRET)) return json({ error: "Invalid Stripe signature" }, 400);
  const event = JSON.parse(raw);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (orderId && session.payment_status === "paid") {
      await env.DB.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ? AND provider = 'stripe' AND provider_ref = ? AND status = 'pending'")
        .bind(new Date().toISOString(), orderId, session.id).run();
    }
  }
  return json({ received: true });
}

async function verifyStripeSignature(payload, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map(part => part.split("=").map(v => v.trim())));
  if (!parts.t || !parts.v1) return false;
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(parts.t + "." + payload));
  const expected = [...new Uint8Array(signed)].map(b => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}
