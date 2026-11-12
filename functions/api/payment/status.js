import { json } from "./_lib.js";
export async function onRequestGet({ request, env }) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId || !env.DB) return json({ error: "orderId and DB are required" }, 400);
  const row = await env.DB.prepare("SELECT status, provider FROM payments WHERE id = ?").bind(orderId).first();
  if (!row) return json({ error: "Order not found" }, 404);
  return json({ orderId, status: row.status, provider: row.provider });
}
