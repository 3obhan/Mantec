import { json, originOf } from "./_lib.js";
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), orderId = url.searchParams.get("orderId"), trackId = url.searchParams.get("trackId");
  if (!orderId || !trackId || !env.DB || !env.ZIBAL_MERCHANT) return new Response("Invalid callback", { status: 400 });
  const row = await env.DB.prepare("SELECT amount, provider_ref, status FROM payments WHERE id = ? AND provider = 'zibal'").bind(orderId).first();
  if (!row || String(row.provider_ref) !== String(trackId)) return new Response("Order not found", { status: 404 });
  if (row.status !== "paid") {
    const res = await fetch("https://gateway.zibal.ir/v1/verify", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ merchant: env.ZIBAL_MERCHANT, trackId: Number(trackId) })
    });
    const data = await res.json();
    if (data.result === 100 && Number(data.amount) === Number(row.amount)) {
      await env.DB.prepare("UPDATE payments SET status='paid', paid_at=? WHERE id=? AND status='pending'").bind(new Date().toISOString(), orderId).run();
    } else if (data.result !== 201) {
      await env.DB.prepare("UPDATE payments SET status='failed' WHERE id=? AND status='pending'").bind(orderId).run();
    }
  }
  return Response.redirect(new URL("/#/analyze?payment=return&orderId=" + encodeURIComponent(orderId), originOf(request)).toString(), 303);
}
