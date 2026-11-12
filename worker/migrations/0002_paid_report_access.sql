-- Apply only to an existing payments table created from the previous schema.
ALTER TABLE payments ADD COLUMN report_json TEXT;
ALTER TABLE payments ADD COLUMN access_token_hash TEXT;
