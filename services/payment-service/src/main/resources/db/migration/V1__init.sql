CREATE TABLE payments
(
    id                 UUID PRIMARY KEY,
    loan_id            UUID           NOT NULL,
    customer_id        UUID           NOT NULL,
    amount             NUMERIC(15, 2) NOT NULL,
    idempotency_key    VARCHAR(120)   NOT NULL UNIQUE,
    status             VARCHAR(30)    NOT NULL,
    provider_reference VARCHAR(120),
    created_at         TIMESTAMPTZ    NOT NULL,
    updated_at         TIMESTAMPTZ    NOT NULL
);
CREATE INDEX idx_payments_loan ON payments (loan_id);
CREATE INDEX idx_payments_customer ON payments (customer_id);