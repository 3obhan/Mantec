# Mantec payments (Cloudflare Workers)

This is a separate Worker entrypoint for the payment-enabled build. It does not replace the currently deployed Worker until you deliberately deploy it.

## Required Cloudflare setup

1. Create a D1 database named `mantec-payments`.
2. Run `wrangler d1 execute mantec-payments --remote --file=./worker/schema.sql`.
3. Put the returned database ID into `wrangler.toml`.
4. Set Worker secrets:
   - `ZIBAL_MERCHANT`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID` (a Stripe Price ID for a one-time USD 1 product)
5. Set `PDF_PRICE_TOMAN` to the intended Iranian price in toman.
6. Configure Stripe webhook endpoint:
   `https://mantec.sobhan-ganji.workers.dev/api/payment/stripe-webhook`
   Subscribe to `checkout.session.completed`.
7. Build the Vite app into `dist` and deploy this Worker only after integrating the UI.

## API

- `POST /api/payment/create` JSON: `{"provider":"zibal"}` or `{"provider":"stripe"}`
  Returns `{orderId, checkoutUrl}`.
- `GET /api/payment/status?orderId=...` returns pending/paid/failed.
- Zibal returns through `/api/payment/zibal-callback`; the Worker verifies the transaction server-to-server.
- Stripe payment is marked paid only by a verified webhook signature.

## Important integration note

The current Mantec PDF is generated client-side in `src/components/Analyze.tsx`. Do not expose the PDF until the UI checks the order status endpoint and receives `paid`. The payment API currently provides payment verification; the UI still needs to retain the report in memory and gate the existing `handleExportPDF` action. For a production-grade entitlement, bind orders to an authenticated user or a high-entropy browser-held order secret; do not treat a guessable order ID as authorization.

Zibal's API amount unit is Rials. This Worker accepts `PDF_PRICE_TOMAN` and multiplies it by 10 before requesting payment.
