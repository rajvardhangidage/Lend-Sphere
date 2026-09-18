CREATE TABLE loan_products
(
    id                   UUID PRIMARY KEY,
    name                 VARCHAR(120)   NOT NULL,
    min_amount           NUMERIC(15, 2) NOT NULL,
    max_amount           NUMERIC(15, 2) NOT NULL,
    annual_interest_rate NUMERIC(7, 4)  NOT NULL,
    max_tenure_months    INT            NOT NULL,
    active               BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE TABLE loan_applications
(
    id            UUID PRIMARY KEY,
    customer_id   UUID           NOT NULL,
    product_id    UUID           NOT NULL REFERENCES loan_products (id),
    amount        NUMERIC(15, 2) NOT NULL,
    tenure_months INT            NOT NULL,
    status        VARCHAR(40)    NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL,
    updated_at    TIMESTAMPTZ    NOT NULL
);

CREATE TABLE repayment_schedule
(
    id                  UUID PRIMARY KEY,
    loan_application_id UUID           NOT NULL REFERENCES loan_applications (id),
    installment_number  INT            NOT NULL,
    due_date            DATE           NOT NULL,
    principal           NUMERIC(15, 2) NOT NULL,
    interest            NUMERIC(15, 2) NOT NULL,
    total_amount        NUMERIC(15, 2) NOT NULL,
    status              VARCHAR(30)    NOT NULL
);

CREATE INDEX idx_loan_app_customer ON loan_applications (customer_id);
CREATE INDEX idx_loan_app_status ON loan_applications (status);
CREATE INDEX idx_schedule_due_date ON repayment_schedule (due_date);

INSERT INTO loan_products(id, name, min_amount, max_amount, annual_interest_rate, max_tenure_months, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Personal Micro Loan', 5000, 200000, 18.0, 24, true);
