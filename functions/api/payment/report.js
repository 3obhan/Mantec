import { json, sha256 } from "./_lib.js";
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId"), token = url.searchParams.get("token");
  if (!orderId || !token || token.length !== 64 || !env.DB) return json({ error: "Valid order credentials are required" }, 400);
  const row = await env.DB.prepare("SELECT status, report_json, access_token_hash FROM payments WHERE id = ?").bind(orderId).first();
  if (!row || await sha256(token) !== row.access_token_hash) return json({ error: "Report access denied" }, 403);
  if (row.status !== "paid") return json({ error: "Payment has not been confirmed" }, 402);
  if (!row.report_json) return json({ error: "Report unavailable" }, 410);
  return json({ report: JSON.parse(row.report_json) });
}
