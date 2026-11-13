# Mantec — Cloudflare Pages with 2 payment types (Zibal + Stripe)

The payment API is implemented as **Cloudflare Pages Functions** in `functions/api/payment/`. It does not use or deploy a standalone Worker. Keep the existing production Worker untouched.

## 1. Where to enter API keys

Open **Cloudflare Dashboard → Workers & Pages → Pages → your Mantec Pages project → Settings → Environment variables**.

Add these under **Production** (and Preview too if you test Preview deployments). Use the encrypted/secret option for credentials:

| Variable | Type | Value |
|---|---|---|
| `ZIBAL_MERCHANT` | Secret | Merchant code from your Zibal panel |
| `STRIPE_SECRET_KEY` | Secret | Stripe secret key (`sk_test_...` for testing, `sk_live_...` for live) |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe webhook signing secret (`whsec_...`) |
| `PDF_PRICE_TOMAN` | Plain variable | PDF price in toman, digits only; minimum 1,000 |

Save the variables and redeploy Pages. Do not put keys in React code, `VITE_*` variables, GitHub, or committed files.

**Where to get them:** Zibal merchant code comes from your Zibal panel. Stripe API key is in Stripe Dashboard → Developers → API keys. The webhook signing secret is in Stripe Dashboard → Developers → Webhooks → your endpoint.

## 2. D1 binding

1. Create a D1 database named `mantec-payments`.
2. Open Pages project → **Settings → Functions → D1 database bindings**.
3. Add a binding with variable name exactly `DB` and select that database.
4. Apply `functions/schema.sql` using Wrangler:
   `npx wrangler d1 execute mantec-payments --remote --file=./functions/schema.sql`
5. Redeploy Pages after adding the binding.

The included `wrangler.toml` is Cloudflare Pages configuration with output directory `dist` and a D1 binding. It has no Worker entry point. Replace the placeholder database ID if using Wrangler configuration.

## 3. Stripe webhook

Create a Stripe webhook endpoint pointing to your **Cloudflare Pages domain**:

`https://YOUR-PAGES-DOMAIN/api/payment/stripe-webhook`

Subscribe to `checkout.session.completed`. Copy its Signing secret into the Pages secret `STRIPE_WEBHOOK_SECRET`. Stripe Checkout charges **USD 1.00** per report. No Stripe Price ID is required.

Use test API and webhook secrets together during testing; use live secrets together for live payments.

## 4. Local development

Create an uncommitted `.dev.vars` file in the repository root:

```dotenv
ZIBAL_MERCHANT=your_zibal_merchant_code
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
PDF_PRICE_TOMAN=your_price_in_toman
```

The file is ignored by Git. Use Wrangler Pages dev after building the site to test Pages Functions locally.

## 5. Payment flow

- `POST /api/payment/create` saves the report in D1, creates a random access token, and starts checkout.
- Only the SHA-256 token hash is stored in D1.
- `GET /api/payment/status?orderId=...` returns status only.
- `GET /api/payment/report?orderId=...&token=...` releases the report only after confirmed payment and token validation.
- Zibal is verified server-to-server by the Pages callback.
- Stripe is verified by webhook signature and the expected USD 1.00 amount.
- The browser creates the PDF only after the protected report endpoint releases the purchased report.

Add a retention policy before using D1 as a permanent report archive.
