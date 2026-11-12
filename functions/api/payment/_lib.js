const enc = new TextEncoder();
export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
export const sha256 = async value => {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("");
};
export const randomToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, "0")).join("");
export const originOf = request => new URL(request.url).origin;
export async function verifyStripeSignature(payload, header, secret) {
  if (!header) return false;
  const parts = header.split(",").map(x => x.trim().split("="));
  const timestamp = parts.find(x => x[0] === "t")?.[1];
  const signatures = parts.filter(x => x[0] === "v1").map(x => x[1]);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, enc.encode(timestamp + "." + payload));
  const expected = [...new Uint8Array(signed)].map(x => x.toString(16).padStart(2, "0")).join("");
  return signatures.some(sig => {
    if (sig.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < sig.length; i++) mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return mismatch === 0;
  });
}
