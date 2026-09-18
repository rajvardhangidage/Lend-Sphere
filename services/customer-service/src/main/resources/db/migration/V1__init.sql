CREATE TABLE customers
(
    id            UUID PRIMARY KEY,
    user_id       UUID         NOT NULL UNIQUE,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30),
    date_of_birth DATE,
    kyc_status    VARCHAR(30)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_customers_user_id ON customers (user_id);
