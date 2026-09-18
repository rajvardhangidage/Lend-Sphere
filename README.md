# FinTech Lending Platform

[![Java 17](https://img.shields.io/badge/Java-17-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot 3.4.5](https://img.shields.io/badge/Spring_Boot-3.4.5-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud 2024.0.2](https://img.shields.io/badge/Spring_Cloud-2024.0.2-6DB33F?style=flat&logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Apache Kafka 3.8.1](https://img.shields.io/badge/Apache_Kafka-3.8.1-231F20?style=flat&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2-2496ED?style=flat&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An event-driven digital lending backend that automates the end-to-end consumer credit lifecycle — from borrower registration and KYC management to rule-based loan origination, amortized installment scheduling, and idempotent payment processing with asynchronous notifications.

---

## Architecture Overview

```mermaid
flowchart TD
    Client(["Web Client / Browser<br><code>:3000</code>"])
    Gateway["API Gateway<br><code>:8080</code> (Spring Cloud Gateway)"]

    subgraph CoreServices["Domain Microservices"]
        Auth["Auth Service<br><code>:8081</code>"]
        Customer["Customer Service<br><code>:8082</code>"]
        Loan["Loan Service<br><code>:8083</code>"]
        Payment["Payment Service<br><code>:8084</code>"]
        Notification["Notification Service<br><code>:8085</code>"]
    end

    subgraph DataTier["Data Persistence & Caching"]
        DB_Auth[(PostgreSQL<br><code>authdb</code>)]
        DB_Cust[(PostgreSQL<br><code>customerdb</code>)]
        DB_Loan[(PostgreSQL<br><code>loandb</code>)]
        DB_Pay[(PostgreSQL<br><code>paymentdb</code>)]
        DB_Notif[(PostgreSQL<br><code>notificationdb</code>)]
        RedisCache[("Redis 7<br><code>loan-products:active</code>")]
    end

    subgraph Broker["Event Streaming (Apache Kafka 3.8.1)"]
        TopicLoan["Topic: <code>loan.events</code><br>(3 Partitions)"]
        TopicPay["Topic: <code>payment.events</code><br>(3 Partitions)"]
    end

    Client -->|HTTP / REST| Gateway

    Gateway -->|/api/v1/auth/**| Auth
    Gateway -->|/api/v1/customers/**| Customer
    Gateway -->|/api/v1/loans/**| Loan
    Gateway -->|/api/v1/payments/**| Payment
    Gateway -->|/api/v1/notifications/**| Notification

    Auth -->|Flyway / JPA| DB_Auth
    Customer -->|Flyway / JPA| DB_Cust
    Loan -->|Flyway / JPA| DB_Loan
    Loan -->|Cache-Aside (10m TTL)| RedisCache
    Payment -->|Flyway / JPA| DB_Pay
    Notification -->|Flyway / JPA| DB_Notif

    Loan -.->|Publish: LOAN_APPROVED / REJECTED| TopicLoan
    Payment -.->|Publish: PAYMENT_SUCCESS| TopicPay

    TopicLoan -.->|Consume: <code>notification-service</code> group| Notification
    TopicPay -.->|Consume: <code>notification-service</code> group| Notification
```

---

## Tech Stack

| Category | Technology | Version | Purpose in this Project |
| :--- | :--- | :--- | :--- |
| **Language** | Java | 17 (OpenJDK / Temurin) | Primary application runtime across all microservices |
| **Framework** | Spring Boot | 3.4.5 | Dependency injection, MVC REST APIs, and Actuator observability |
| **API Gateway** | Spring Cloud Gateway | 2024.0.2 | Edge reverse proxy, unified route dispatch, and global CORS handling |
| **Database** | PostgreSQL | 16 (Alpine) | Dedicated relational database per service (`authdb`, `customerdb`, etc.) |
| **Data Persistence** | Hibernate / Spring Data JPA | 6.6.x (Boot BOM) | Entity-relational mapping, repositories, and transaction management |
| **Schema Migration** | Flyway | 10.21.x (Boot BOM) | Automated, version-controlled SQL schema creation and seeding per DB |
| **Event Streaming** | Apache Kafka | 3.8.1 (Bitnami KRaft) | Asynchronous pub/sub for loan status changes and payment events |
| **Caching** | Redis | 7 (Alpine) | Cache-aside layer for active loan product catalog queries |
| **Security & Auth** | Spring Security & JJWT | JJWT 0.12.6 | Stateless JWT generation, signature verification, and RBAC |
| **API Documentation**| Springdoc OpenAPI | 2.8.6 | OpenAPI v3 specification and interactive Swagger UI per service |
| **Frontend UI** | HTML5 / CSS3 / Vanilla JS | ES6 Modules | Reactive dashboard served via Nginx on port 3000 |
| **Testing** | JUnit 5 & Mockito | 5.11.x / 5.14.x | Unit tests, mock injection, and business logic verification |

---

## Key Engineering Decisions

- **Idempotency-Key Payment Deduplication** ([`PaymentService.java`](services/payment-service/src/main/java/com/rajvardhan/lending/payment/PaymentService.java#L21-L28), [`Payment.java`](services/payment-service/src/main/java/com/rajvardhan/lending/payment/Payment.java#L20-L21))
  The payment endpoint mandates an `Idempotency-Key` HTTP header backed by a database unique constraint on `payments.idempotency_key`. The service looks up existing keys before processing; duplicate submissions return the original payment without re-charging or publishing duplicate Kafka events.
  *Why this matters:* Eliminates double-debiting and ghost transactions caused by client network retries or gateway timeouts.

- **Strict Database-per-Service Isolation** ([`init.sql`](infra/postgres/init.sql), [`docker-compose.yml`](docker-compose.yml#L57-L128))
  Each service operates against its own distinct database schema (`authdb`, `customerdb`, `loandb`, `paymentdb`, `notificationdb`). Cross-boundary joins are prohibited; communication occurs strictly over REST contracts or Kafka events.
  *Why this matters:* Guarantees bounded context isolation, prevents cross-service database lock contention, and enables services to scale or migrate storage independently.

- **Arbitrary-Precision Reducing-Balance EMI Math with Penny Re-absorption** ([`LoanService.java`](services/loan-service/src/main/java/com/rajvardhan/lending/loan/LoanService.java#L88-L107))
  Installment amortization uses `BigDecimal` with 12 decimal places of precision (`RoundingMode.HALF_UP`) during monthly interest calculations and rounds installments to 2 decimal places. The final tenure installment directly assigns `principal = balance`.
  *Why this matters:* Avoids cumulative binary floating-point drift (IEEE 754) and guarantees the sum of scheduled principal payments matches the disbursed loan amount down to the exact cent.

- **Fault-Tolerant Cache-Aside with Graceful Fallback** ([`LoanService.java`](services/loan-service/src/main/java/com/rajvardhan/lending/loan/LoanService.java#L29-L40))
  Active product listings leverage Redis key `loan-products:active` with a 10-minute TTL. The Redis lookup is wrapped in an exception fallback block that transparently executes a direct PostgreSQL query if Redis is unreachable.
  *Why this matters:* Prevents cache outages from taking down the customer loan application flow, ensuring high availability under infrastructure degradation.

- **Stateless Distributed Role Normalization** ([`SecurityConfig.java`](services/loan-service/src/main/java/com/rajvardhan/lending/loan/SecurityConfig.java#L20-L25), [`JwtAuthenticationFilter.java`](services/loan-service/src/main/java/com/rajvardhan/lending/loan/JwtAuthenticationFilter.java#L35-L42))
  Services independently verify JWT HMAC-SHA signatures statelessly. Filters normalize authority strings to prevent duplicate `ROLE_ROLE_` prefixes while restricting state-transition operations (such as `/approve` and `/reject`) to `ADMIN` and `LOAN_OFFICER` roles.
  *Why this matters:* Downstream microservices authorize requests locally without creating an RPC bottleneck back to `auth-service` for token validation.

---

## API Documentation

### Interactive Swagger UI Portals

When running locally, Swagger / OpenAPI interfaces are accessible per microservice:

- **Auth Service**: [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **Customer Service**: [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html)
- **Loan Service**: [http://localhost:8083/swagger-ui.html](http://localhost:8083/swagger-ui.html)
- **Payment Service**: [http://localhost:8084/swagger-ui.html](http://localhost:8084/swagger-ui.html)
- **Notification Service**: [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html)

### Core API Endpoints (via API Gateway `:8080`)

| Method | Path | Required Headers / Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | None (Public) | Registers new user; returns signed JWT access token |
| `GET` | `/api/v1/loans/products` | None (Public) | Retrieves active loan products with min/max bounds and interest rates |
| `POST` | `/api/v1/loans/applications` | `Bearer <JWT>` (Customer) | Validates amount/tenure constraints and creates a `PENDING` loan application |
| `POST` | `/api/v1/loans/{id}/approve` | `Bearer <JWT>` (`ADMIN`, `LOAN_OFFICER`) | Approves loan, generates amortized repayment schedule, and emits `loan.events` |
| `POST` | `/api/v1/payments` | `Bearer <JWT>`, `Idempotency-Key: <UUID>` | Records loan repayment, validates deduplication key, and emits `payment.events` |
| `GET` | `/api/v1/notifications?recipient={id}`| None (Internal/Gateway) | Queries asynchronous event-driven notifications generated for customer |

---

## Getting Started

### Prerequisites

- **Java Development Kit (JDK)**: Version 17+
- **Docker & Docker Compose**: Docker Engine 24+ with Compose v2
- Maven is packaged via the included `./mvnw` wrapper.

### Step-by-Step Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fintech-lending-platform.git
   cd fintech-lending-platform
   ```

2. **Compile and package all service JARs**:
   ```bash
   ./mvnw clean package -DskipTests
   ```

3. **Launch the platform via Docker Compose**:
   ```bash
   docker compose up --build
   ```

4. **Verify running containers**:
   ```bash
   docker compose ps
   ```

### Environment Variables

Each microservice accepts production configuration overrides via environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_URL` | `jdbc:postgresql://postgres:5432/<db_name>` | JDBC database connection string |
| `DB_USERNAME` | `lending` | PostgreSQL database user |
| `DB_PASSWORD` | `lending_dev_password` | PostgreSQL database password |
| `JWT_SECRET` | `change-me-in-development-only-change-me-in-production` | 256-bit secret key for HMAC-SHA token signing |
| `REDIS_HOST` | `redis` | Redis host for product catalog caching |
| `KAFKA_BOOTSTRAP`| `kafka:9092` | Kafka broker bootstrap server address |
| `AUTH_URL` | `http://auth-service:8081` | Gateway route target for authentication service |
| `CUSTOMER_URL` | `http://customer-service:8082` | Gateway route target for customer service |
| `LOAN_URL` | `http://loan-service:8083` | Gateway route target for loan service |
| `PAYMENT_URL` | `http://payment-service:8084` | Gateway route target for payment service |
| `NOTIFICATION_URL`| `http://notification-service:8085` | Gateway route target for notification service |

### Health Check Verification

Test gateway routing and service health checks:

```bash
# Check API Gateway Health
curl -s http://localhost:8080/actuator/health

# Check Individual Domain Services
curl -s http://localhost:8081/actuator/health
curl -s http://localhost:8083/actuator/health
```
*(All endpoints return `{"status":"UP"}` when operational.)*

Open **[http://localhost:3000](http://localhost:3000)** in your browser to access the management UI.

### Pre-Seeded Test Credentials

| Role | Email | Password | Allowed Operations |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@lending.com` | `AdminPassword123` | View all applications, approve/reject loans |
| **Loan Officer** | `officer@lending.com` | `OfficerPassword123` | View all applications, approve/reject loans |
| **Customer** | Register via UI or API | Custom | Apply for loans, view personal schedule, make repayments |

---

## Project Structure

```text
fintech-lending-platform/
├── pom.xml                         # Root parent POM managing dependencies, versions, and build plugins
├── docker-compose.yml              # Local orchestration (Postgres, Redis, Kafka, 6 microservices, Web UI)
├── infra/
│   └── postgres/init.sql           # Database initialization script creating 5 isolated schemas
├── frontend/                       # Lightweight reactive Web dashboard (ES6 modules, Nginx)
└── services/
    ├── api-gateway/                # Spring Cloud Gateway routing requests to downstream services
    ├── auth-service/               # User authentication, registration, BCrypt hashing, and JWT issuance
    ├── customer-service/           # Customer profile management and KYC tracking
    ├── loan-service/               # Loan product catalog, application lifecycle, and EMI schedule generation
    ├── payment-service/            # Repayment processing with Idempotency-Key deduplication
    └── notification-service/       # Kafka event consumer recording in-app audit notifications
```

---

## Testing

Run the test suite across all 6 microservices using the Maven wrapper:

```bash
./mvnw clean test
```

### Test Coverage Summary

- **Unit & Slice Testing**: Built using **JUnit 5** and **Mockito**.
- **`auth-service`**:
  - `AuthControllerTest`: Validates successful user registration, duplicate email rejection, BCrypt credential checks, and JWT response generation.
  - `JwtServiceTest`: Tests HMAC token signing, claim extraction, and expiration validation.
- **`customer-service`**:
  - `CustomerControllerTest`: Verifies customer profile creation, duplicate user profile prevention, and KYC status initialization.
- **`loan-service`**:
  - `LoanServiceTest`: Asserts credit limit validation against product bounds, tenure boundaries, reducing-balance EMI schedule calculations, state-machine transition integrity, and Kafka `loan.events` emission.
  - `LoanControllerTest`: Tests catalog retrieval, application submission, and repayment schedule queries.
- **`payment-service`**:
  - `PaymentServiceTest`: Verifies idempotency key deduplication (returns existing payment without re-executing business logic), negative/zero payment amount rejection, and `payment.events` publication.
- **`notification-service`**:
  - `EventConsumerTest`: Tests Kafka event deserialization for `LOAN_APPROVED` and `PAYMENT_SUCCESS` payloads into persistent notification records.
  - `NotificationControllerTest`: Verifies notification querying by recipient and aggregate ID.
- **`api-gateway`**:
  - `GatewayRouteTest`: Verifies Spring context loading and gateway route definitions.

---

## Live Demo

Deployed at: [URL] (may be stopped outside active demo windows — see note below)

> **Deployment Note:** This is a portfolio demonstration environment deployed on single-instance container infrastructure without multi-region clustering, automated horizontal pod autoscaling, or managed enterprise monitoring.
