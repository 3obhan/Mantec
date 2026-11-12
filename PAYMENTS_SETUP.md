# Mantec — paid PDF setup (Zibal + Stripe)

The payment Worker is in `worker/index.js`. It is a separate entry point; it does not alter or deploy your live Worker by itself.

## 1. Where to enter API keys (Cloudflare dashboard)

Open **Cloudflare Dashboard → Workers & Pages → select the Worker that will run this code → Settings → Variables and Secrets → Add**.

Add these as **Secret** values (never commit them to GitHub and never put them in frontend `VITE_*` variables):

| Name | Type | Where to get it |
|---|---|---|
| `ZIBAL_MERCHANT` | Secret | Merchant code from your Zibal panel |
| `STRIPE_SECRET_KEY` | Secret | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret |

For each one: choose **Secret**, enter the exact name above, paste its value, then Save. If you use separate test/live credentials, use matching Stripe test/live mode for both the secret key and webhook signing secret.

### Non-secret settings (Variables)

In the same **Settings → Variables and Secrets** section, add:

| Name | Type | Example / meaning |
|---|---|---|
| `PDF_PRICE_TOMAN` | Variable | Your chosen price in toman (digits only; minimum 1,000) |
| `APP_ORIGIN` | Variable | `https://mantec.sobhan-ganji.workers.dev` |

Do not paste the actual secret values into this file, source code, GitHub Issues, or chat.

## 2. Stripe setup

1. In Stripe, create/enable a webhook endpoint:
   `https://mantec.sobhan-ganji.workers.dev/api/payment/stripe-webhook`
2. Subscribe to **`checkout.session.completed`**.
3. Copy the endpoint's **Signing secret** (starts with `whsec_`) into Cloudflare as `STRIPE_WEBHOOK_SECRET`.
4. The Worker creates a one-time **USD 1.00** Checkout Session directly; no Stripe Price ID is required.

## 3. Zibal setup

Copy the merchant code from Zibal and save it as `ZIBAL_MERCHANT`. Set `PDF_PRICE_TOMAN` to the amount customers in Iran should pay, in toman. The Worker converts toman to rial for Zibal's API.

## 4. D1 database

1. Create a Cloudflare D1 database named `mantec-payments`.
2. Copy its database ID into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
3. For a **new/empty** database, apply the schema:
   `wrangler d1 execute mantec-payments --remote --file=./worker/schema.sql`
4. If the database already has the previous payments table, apply the migration:
   `wrangler d1 execute mantec-payments --remote --file=./worker/migrations/0002_paid_report_access.sql`
5. Keep the D1 binding name exactly `DB`.

The schema stores the report until the payment entitlement is needed. Add a retention/cleanup policy before treating this as a long-term report archive.

## 5. Local development

Create a local-only file named `.dev.vars` in the repository root (do not commit it):

```dotenv
ZIBAL_MERCHANT=your_zibal_merchant_code
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
PDF_PRICE_TOMAN=your_price_in_toman
APP_ORIGIN=http://localhost:8787
```

Keep `.dev.vars` out of Git. If the repository does not already ignore it, add it to `.gitignore`.

## 6. Payment and report access

- `POST /api/payment/create` accepts `{provider, report:{text, fallacies, lang}}`.
- The Worker creates a random 256-bit report token and stores only its SHA-256 hash in D1.
- `GET /api/payment/status?orderId=...` reports the payment state; it does not grant access to the report.
- `GET /api/payment/report?orderId=...&token=...` returns report content only after the server confirms payment and validates the token.
- Zibal is verified server-to-server on callback. Stripe is marked paid only by a valid webhook signature and the expected USD 1.00 amount.
- PDF rendering remains in the existing browser renderer, but the report payload is delivered to the browser only after the paid check.

Never use a public order ID alone as authorization. Never expose payment keys in browser code.
