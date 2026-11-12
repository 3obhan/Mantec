import { json, verifyStripeSignature } from "./_lib.js";
export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.STRIPE_WEBHOOK_SECRET) return json({ error: "Stripe webhook secret or DB binding missing" }, 503);
  const raw = await request.text();
  if (!await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)) return json({ error: "Invalid Stripe signature" }, 400);
  const event = JSON.parse(raw);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (orderId && session.payment_status === "paid" && Number(session.amount_total) === 100 && session.currency === "usd") {
      await env.DB.prepare("UPDATE payments SET status='paid', paid_at=? WHERE id=? AND provider='stripe' AND provider_ref=? AND amount=100 AND currency='USD' AND status='pending'")
        .bind(new Date().toISOString(), orderId, session.id).run();
    }
  }
  return json({ received: true });
}
