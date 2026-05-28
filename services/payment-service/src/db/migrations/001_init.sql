CREATE TABLE IF NOT EXISTS payments (
    payment_id   TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    tweet_id     TEXT,
    amount       NUMERIC(18, 4) NOT NULL,
    currency     CHAR(3) NOT NULL,
    description  TEXT NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
