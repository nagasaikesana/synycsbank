# Banking Application — Project Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Backend Documentation](#4-backend-documentation)
5. [Frontend Documentation](#5-frontend-documentation)
6. [Database Documentation](#6-database-documentation)
7. [Configuration](#7-configuration)
8. [Setup Instructions](#8-setup-instructions)
9. [Future Enhancements](#9-future-enhancements)
10. [Known Limitations](#10-known-limitations)
11. [Security Considerations](#11-security-considerations)

---

## 1. Executive Summary

### Purpose

This Banking Application is a full-stack web application that simulates core banking operations. It provides a structured interface for managing customers, their bank accounts (Savings and Current), and transaction histories with full running-balance tracking.

### System Overview

The system follows a three-tier architecture:

- **Presentation Tier** — A React single-page application that provides customer browsing, account viewing, and transaction history with filtering capabilities.
- **Application Tier** — A FastAPI REST backend that implements business logic including deposits, withdrawals, transfers, balance tracking, and transaction filtering with preset date ranges.
- **Data Tier** — A PostgreSQL relational database storing customers, accounts, and transactions with enforced referential integrity.

The application seeds realistic development data on startup — 6 customers, 12 accounts (savings + current per customer), and 70–100+ randomized transactions spanning August 2025 to the present date.

---

## 2. Architecture Overview

### High-Level Architecture

```
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────┐
│                      │  HTTP   │                      │  SQL    │              │
│   React Frontend     │────────▶│   FastAPI Backend     │────────▶│  PostgreSQL  │
│   (Vite Dev Server)  │◀────────│   (Uvicorn ASGI)     │◀────────│  Database    │
│   Port 5173          │  JSON   │   Port 8000           │  Async  │  Port 5432   │
│                      │         │                      │         │              │
└──────────────────────┘         └──────────────────────┘         └──────────────┘
```

### Backend Architecture

The backend follows a layered service architecture:

```
Routers (API Layer)
    │
    ▼
Services (Business Logic)
    │
    ▼
Models (ORM / Database Layer)
```

- **Routers** — Define HTTP endpoints, handle request/response serialization, and delegate to services.
- **Services** — Contain all business logic: balance calculations, validation, transfer orchestration, date-range resolution.
- **Models** — SQLAlchemy ORM classes mapping directly to PostgreSQL tables.
- **Schemas** — Pydantic models for request validation and response serialization.

### Frontend Architecture

The frontend is a single-page application with page-level state management:

```
main.tsx (BrowserRouter)
    │
    ▼
App.tsx (Routes + Header)
    │
    ├── CustomersPage         → GET /api/customers/
    ├── CustomerAccountsPage  → GET /api/customers/:id + /accounts
    └── TransactionsPage      → GET /api/accounts/:id/transactions
```

### Data Flow

```
User Action (Click/Filter)
    │
    ▼
React Component (useState + useEffect)
    │
    ▼
Axios HTTP Request (api.ts)
    │
    ▼
FastAPI Router (request validation via Pydantic)
    │
    ▼
Service Layer (business logic, balance calculation)
    │
    ▼
SQLAlchemy ORM (async query via AsyncSession)
    │
    ▼
PostgreSQL (asyncpg driver)
    │
    ▼
Response flows back: DB → ORM → Service → Router → JSON → Axios → React State → UI
```

---

## 3. Technology Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.115.6 | Web framework — high performance, automatic OpenAPI docs, async-native |
| Uvicorn | 0.34.0 | ASGI server — production-grade, supports hot reload in development |
| SQLAlchemy | 2.0.36 | ORM — async support, type-safe mapped columns, relationship management |
| AsyncPG | 0.30.0 | PostgreSQL driver — native async, high throughput for concurrent connections |
| Pydantic | 2.10.4 | Data validation — request/response schemas with automatic type coercion |
| Pydantic Settings | 2.7.1 | Configuration management — environment variable loading with `.env` support |
| Alembic | 1.14.1 | Database migrations (available but not actively used in dev mode) |
| python-dotenv | 1.0.1 | Environment variable loading from `.env` files |
| python-dateutil | 2.9.0 | Date arithmetic — `relativedelta` for month/year-based preset ranges |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI library — component-based, hooks for state management |
| React DOM | 19.2.0 | React renderer for the browser |
| React Router DOM | 7.13.1 | Client-side routing — declarative route definitions |
| Axios | 1.13.6 | HTTP client — promise-based, interceptor support, cleaner API than fetch |
| TypeScript | 5.9.3 | Type safety — compile-time error detection, IDE support |
| Vite | 8.0.0-beta.13 | Build tool — fast HMR, optimized production builds |
| ESLint | 9.39.1 | Linting — code quality enforcement |

### Database

| Technology | Version | Purpose |
|---|---|---|
| PostgreSQL | 14+ | Relational database — ACID compliance, robust JSON support, proven reliability |

### Technology Choices Rationale

- **FastAPI** was chosen over Flask/Django for its native async support, automatic request validation via Pydantic, and built-in OpenAPI documentation.
- **SQLAlchemy 2.0 (async)** provides a mature ORM with full async/await support, eliminating the need for blocking database calls.
- **AsyncPG** is the fastest Python PostgreSQL driver, purpose-built for asyncio.
- **React + Vite** provides a modern, fast development experience with hot module replacement and optimized production builds.
- **Axios** was chosen over the native Fetch API for its cleaner syntax, automatic JSON parsing, and request/response interceptor capabilities.

---

## 4. Backend Documentation

### Project Structure

```
backend/
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── requirements.txt              # Python dependencies
└── app/
    ├── __init__.py
    ├── main.py                   # FastAPI app creation, lifespan, CORS, router registration
    ├── config.py                 # Settings class (DATABASE_URL, APP_NAME)
    ├── database.py               # Engine, session factory, Base class, init_db()
    ├── exceptions.py             # Custom HTTP exception classes
    ├── models/
    │   ├── __init__.py           # Model imports for metadata discovery
    │   ├── customer.py           # Customer ORM model
    │   ├── account.py            # Account ORM model + AccountType enum + interest rate ranges
    │   └── transaction.py        # Transaction ORM model + TransactionType/Mode enums
    ├── schemas/
    │   ├── __init__.py
    │   ├── customer.py           # CustomerCreate, CustomerResponse
    │   ├── account.py            # AccountCreate, AccountUpdate, AccountResponse
    │   └── transaction.py        # DepositRequest, WithdrawRequest, TransferRequest, TransactionResponse
    ├── services/
    │   ├── __init__.py
    │   ├── customer_service.py   # Customer CRUD + auto-generated customer codes
    │   ├── account_service.py    # Account CRUD + seed_data() function
    │   └── transaction_service.py # Deposit, withdraw, transfer, filtered listing
    └── routers/
        ├── __init__.py
        ├── customers.py          # /api/customers endpoints
        ├── accounts.py           # /api/accounts endpoints
        └── transactions.py       # /api/accounts/:id/transactions endpoints
```

### Database Schema Details

#### Entity-Relationship Hierarchy

```
Customer (1) ──────── (N) Account (1) ──────── (N) Transaction
```

- A **Customer** has one or more **Accounts**.
- An **Account** has one or more **Transactions**.
- Each **Transaction** records the `balance_after` field, representing the account balance immediately after that transaction was applied.

#### Customer Model

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Indexed | Auto-incrementing primary key |
| `customer_code` | String(6) | Unique, Indexed, Not Null | Zero-padded 6-digit code (e.g., `000001`) |
| `full_name` | String(255) | Not Null | Customer's full name |
| `created_at` | DateTime(tz) | Server Default: `now()` | Record creation timestamp |

#### Account Model

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Indexed | Auto-incrementing primary key |
| `customer_id` | Integer | FK → `customers.id`, Indexed | Owning customer |
| `holder_name` | String(255) | Not Null | Account holder display name |
| `account_type` | Enum | Not Null | One of: `savings`, `current`, `loan`, `minor`, `joint` |
| `balance` | Numeric(15,2) | Default: `0.00` | Current account balance |
| `interest_rate` | Numeric(5,2) | Not Null | Annual interest rate percentage |

#### Transaction Model

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | PK, Indexed | Auto-incrementing primary key |
| `account_id` | Integer | FK → `accounts.id`, Indexed | Parent account |
| `transaction_type` | Enum | Not Null | `credit` or `debit` |
| `mode` | Enum | Not Null | Payment channel (see below) |
| `amount` | Numeric(15,2) | Not Null | Transaction amount |
| `balance_after` | Numeric(15,2) | Not Null | Account balance after this transaction |
| `reference_id` | String(255) | Nullable | External reference (UPI ID, NEFT ref, etc.) |
| `description` | String(500) | Nullable | Human-readable description |
| `related_account_id` | Integer | FK → `accounts.id`, Nullable | Counterpart account for internal transfers |
| `created_at` | DateTime(tz) | Server Default: `now()`, Indexed | Transaction timestamp |

**Transaction Modes:** `UPI`, `NEFT`, `RTGS`, `IMPS`, `Salary`, `Charges`, `Loan Repayment`, `Cash`, `Internal Transfer`

### Business Rules

#### Interest Rate Logic

Each account type has a default interest rate and an allowed range for updates:

| Account Type | Default Rate | Allowed Range |
|---|---|---|
| Savings | 7.0% | 6.0% – 8.0% |
| Current | 3.0% | 2.0% – 4.0% |
| Loan | 10.0% | 8.0% – 12.0% |
| Minor | 5.0% | 4.0% – 6.0% |
| Joint | 6.0% | 5.0% – 7.0% |

When updating an account's interest rate via `PATCH /api/accounts/:id`, the rate must fall within the allowed range for that account type. Requests outside this range are rejected with HTTP 400.

#### Running Balance Calculation

The running balance is tracked at the transaction level:

1. **On deposit (credit):** `account.balance += amount` → `balance_after = account.balance`
2. **On withdrawal (debit):** Verify `account.balance >= amount`, then `account.balance -= amount` → `balance_after = account.balance`
3. **On transfer:** The sender's balance is decremented and the receiver's balance is incremented atomically. Two transaction records are created — a debit on the source account and a credit on the destination account, each with their respective `balance_after`.
4. **On listing:** Transactions are ordered by `created_at ASC`. The `running_balance` field in the API response equals `balance_after` for each transaction, representing the cumulative balance at that point in time.

Transfer operations use `SELECT ... FOR UPDATE` with consistent row ordering to prevent deadlocks.

#### Transaction Filtering Logic

The `GET /api/accounts/:id/transactions` endpoint supports:

| Parameter | Type | Description |
|---|---|---|
| `from_date` | `YYYY-MM-DD` | Start of date range (inclusive) |
| `to_date` | `YYYY-MM-DD` | End of date range (inclusive, up to 23:59:59.999999 UTC) |
| `type` | `credit` or `debit` | Filter by transaction direction |
| `preset_range` | String | Predefined date range (overrides `from_date`/`to_date`) |

**Preset ranges:**

| Preset | Resolution |
|---|---|
| `this_month` | 1st of current month → today |
| `last_2_months` | 2 months ago → today |
| `last_90_days` | 90 days ago → today |
| `last_6_months` | 6 months ago → today |
| `last_1_year` | 1 year ago → today |

Validation: `to_date` cannot be in the future (HTTP 400 `FutureDateError`).

#### Seed Data Generation Logic

On application startup, if the database is empty, the `seed_data()` function generates:

1. **6 Customers** with auto-generated codes (`000001`–`000006`).
2. **12 Accounts** — each customer receives one Savings and one Current account, both initialized with a balance of ₹1,00,000.
3. **Initial Deposit** — Each account's first transaction is a `CREDIT` / `Cash` entry of ₹1,00,000 with description `"Initial Deposit"`, dated within the first 3 days of August 2025.
4. **Random Transactions** — Each account receives 5–8 additional transactions (10–16 per customer across both accounts):
   - **Credits:** Salary (₹25,000–95,000), UPI receipts, NEFT freelance payments, RTGS large transfers, IMPS transfers, cash deposits.
   - **Debits:** UPI purchases (Swiggy, Amazon, Flipkart, etc.), NEFT rent/EMI, RTGS large payments, bank charges, loan repayments, IMPS transfers, ATM withdrawals.
   - Amounts are rounded to the nearest ₹50.
   - Dates are randomly distributed between August 2025 and the current date, sorted chronologically.
   - Debit amounts are capped to prevent negative balances.
   - Each account's final `balance` field matches the `balance_after` of its last transaction.

### API Endpoint Documentation

#### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Returns `{"status": "ok"}` |

#### Customers

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `POST` | `/api/customers/` | 201 | Create a new customer. Body: `{"full_name": "..."}`. Auto-generates `customer_code`. |
| `GET` | `/api/customers/` | 200 | List all customers ordered alphabetically by name. |
| `GET` | `/api/customers/:id` | 200 | Get a single customer by ID. Returns 404 if not found. |
| `GET` | `/api/customers/:id/accounts` | 200 | List all accounts belonging to a customer. Returns 404 if customer not found. |

**CustomerCreate Request:**
```json
{ "full_name": "string (1–255 chars, required)" }
```

**CustomerResponse:**
```json
{
  "id": 1,
  "customer_code": "000001",
  "full_name": "Aarav Sharma",
  "created_at": "2025-08-01T00:00:00+00:00"
}
```

#### Accounts

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `POST` | `/api/accounts/` | 201 | Create a new account for an existing customer. |
| `GET` | `/api/accounts/` | 200 | List all accounts ordered by ID. |
| `GET` | `/api/accounts/:id` | 200 | Get a single account. Returns 404 if not found. |
| `PATCH` | `/api/accounts/:id` | 200 | Update `holder_name` and/or `interest_rate`. Rate must be within allowed range. |
| `DELETE` | `/api/accounts/:id` | 204 | Delete an account. Returns 404 if not found. |

**AccountCreate Request:**
```json
{
  "customer_id": 1,
  "holder_name": "string (1–255 chars, required)",
  "account_type": "savings | current | loan | minor | joint"
}
```

**AccountUpdate Request:**
```json
{
  "holder_name": "string (optional)",
  "interest_rate": 7.5
}
```

**AccountResponse:**
```json
{
  "id": 1,
  "customer_id": 1,
  "holder_name": "Aarav Sharma",
  "account_type": "savings",
  "balance": 100000.00,
  "interest_rate": 7.0
}
```

#### Transactions

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `POST` | `/api/accounts/:id/deposit` | 200 | Credit funds to an account. |
| `POST` | `/api/accounts/:id/withdraw` | 200 | Debit funds from an account. Fails if insufficient balance. |
| `POST` | `/api/accounts/:id/transfer` | 200 | Transfer between two accounts. Returns both transaction records. |
| `GET` | `/api/accounts/:id/transactions` | 200 | List transactions with optional date/type/preset filters. |

**DepositRequest:**
```json
{
  "amount": 5000.00,
  "mode": "Cash",
  "reference_id": "optional",
  "description": "optional"
}
```

**WithdrawRequest:**
```json
{
  "amount": 2000.00,
  "mode": "UPI",
  "reference_id": "optional",
  "description": "optional"
}
```

**TransferRequest:**
```json
{
  "to_account_id": 2,
  "amount": 10000.00,
  "description": "optional"
}
```

**TransactionResponse:**
```json
{
  "id": 1,
  "account_id": 1,
  "transaction_type": "credit",
  "mode": "Cash",
  "amount": 100000.00,
  "balance_after": 100000.00,
  "running_balance": 100000.00,
  "reference_id": null,
  "description": "Initial Deposit",
  "related_account_id": null,
  "created_at": "2025-08-01T12:00:00+00:00"
}
```

#### Error Responses

| HTTP Status | Error | Trigger |
|---|---|---|
| 400 | `Amount must be greater than zero` | Deposit/withdraw/transfer with amount ≤ 0 |
| 400 | `Insufficient funds` | Withdrawal or transfer exceeding balance |
| 400 | `Cannot transfer to the same account` | Transfer where source = destination |
| 400 | `to_date cannot be in the future` | Date filter with a future `to_date` |
| 400 | `Invalid account type` | Account creation with unsupported type |
| 400 | `Interest rate for {type} must be between...` | Rate update outside allowed range |
| 404 | `Customer {id} not found` | Invalid customer ID |
| 404 | `Account {id} not found` | Invalid account ID |

---

## 5. Frontend Documentation

### Folder Structure

```
frontend/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
└── src/
    ├── main.tsx                  # App bootstrap — BrowserRouter, StrictMode, CSS import
    ├── App.tsx                   # Route definitions + app header
    ├── types.ts                  # TypeScript interfaces (Customer, Account, Transaction)
    ├── services/
    │   └── api.ts                # Axios instance (baseURL: http://127.0.0.1:8000)
    ├── pages/
    │   ├── CustomersPage.tsx     # Customer listing
    │   ├── CustomerAccountsPage.tsx  # Customer detail + account cards
    │   └── TransactionsPage.tsx  # Transaction history with filters
    └── styles/
        └── index.css             # All application styles (single file)
```

### Routing Structure

| Route | Component | Description |
|---|---|---|
| `/` | `Navigate → /customers` | Root redirect |
| `/customers` | `CustomersPage` | Displays all customers as clickable cards |
| `/customers/:id` | `CustomerAccountsPage` | Shows customer info + their account cards |
| `/accounts/:id/transactions` | `TransactionsPage` | Account header + filter panel + transaction list |

Navigation flow: Customers → Click customer → Accounts → Click account → Transactions.

Breadcrumb navigation is displayed on the Accounts and Transactions pages for back-navigation.

### State Management Approach

The application uses **local component state** exclusively — no global state management library (Redux, Zustand, Context API).

Each page manages its own state using React hooks:

- `useState` — For data (`customers`, `accounts`, `transactions`), UI state (`loading`, `error`), and filter values.
- `useEffect` — For fetching data on mount or when route parameters change.
- `useCallback` — For memoizing the `fetchTransactions` function to prevent unnecessary re-renders.
- `useParams` — For extracting route parameters (`:id`).
- `useNavigate` — For programmatic navigation on card clicks.

### API Integration

All API calls are made through a centralized Axios instance (`src/services/api.ts`):

```typescript
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});
```

**Endpoints consumed:**

| Page | API Call |
|---|---|
| CustomersPage | `GET /api/customers/` |
| CustomerAccountsPage | `GET /api/customers/:id` + `GET /api/customers/:id/accounts` (parallel) |
| TransactionsPage | `GET /api/accounts/:id` + `GET /api/accounts/:id/transactions` (parallel) |

Parallel requests use `Promise.all()` for optimal loading performance.

### Filter Handling Logic

The TransactionsPage provides three filter mechanisms:

1. **Preset Range Buttons** — Clicking a preset (`This Month`, `Last 2 Months`, `90 Days`, `Last 6 Months`, `Last 1 Year`) immediately triggers a fetch with the `preset_range` query parameter. Selecting a preset clears manual date inputs.

2. **Manual Date Range** — `From` and `To` date inputs. Both are capped at today's date via the `max` attribute. Entering a manual date clears the active preset.

3. **Transaction Type Toggle** — Three-state toggle: `All`, `Credit`, `Debit`. Sent as the `type` query parameter (omitted when `All` is selected).

Filters are applied via the `Apply Filter` button. The `Clear` button resets all filter state and fetches unfiltered transactions.

### UI Structure

- **Layout** — Centered container (max-width 960px) with a sticky header displaying "Banking App" as a home link.
- **Customer Cards** — Grid of clickable cards showing customer code (monospace badge) and name.
- **Account Cards** — Color-coded by type (green = savings, blue = current, red = loan, yellow = minor, purple = joint). Display balance, holder name, and interest rate.
- **Transaction Header** — Gradient card showing account ID, type badge, current balance, holder name, and interest rate.
- **Transaction List** — Vertically stacked items with credit/debit badge, description, mode, reference ID, signed amount (green +/red -), running balance, and date.
- **Responsive** — Single breakpoint at 640px. Filter row stacks vertically; transaction items switch to column layout on mobile.

### Currency Formatting

All monetary values use Indian locale formatting:
```typescript
Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })
```
Prefixed with the ₹ symbol. Amounts from the API arrive as strings (Decimal serialization) and are converted to `Number()` for display.

---

## 6. Database Documentation

### Tables

#### `customers`

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `SERIAL` | No | Auto-increment | Primary key |
| `customer_code` | `VARCHAR(6)` | No | — | Unique 6-digit identifier |
| `full_name` | `VARCHAR(255)` | No | — | Customer name |
| `created_at` | `TIMESTAMPTZ` | No | `now()` | Creation timestamp |

#### `accounts`

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `SERIAL` | No | Auto-increment | Primary key |
| `customer_id` | `INTEGER` | No | — | FK → `customers.id` |
| `holder_name` | `VARCHAR(255)` | No | — | Account holder name |
| `account_type` | `ENUM(accounttype)` | No | — | Account category |
| `balance` | `NUMERIC(15,2)` | No | `0.00` | Current balance |
| `interest_rate` | `NUMERIC(5,2)` | No | — | Annual interest rate (%) |

#### `transactions`

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `SERIAL` | No | Auto-increment | Primary key |
| `account_id` | `INTEGER` | No | — | FK → `accounts.id` |
| `transaction_type` | `ENUM(transactiontype)` | No | — | `credit` or `debit` |
| `mode` | `ENUM(transactionmode)` | No | — | Payment channel |
| `amount` | `NUMERIC(15,2)` | No | — | Transaction amount |
| `balance_after` | `NUMERIC(15,2)` | No | — | Balance after this transaction |
| `reference_id` | `VARCHAR(255)` | Yes | `NULL` | External reference ID |
| `description` | `VARCHAR(500)` | Yes | `NULL` | Human-readable description |
| `related_account_id` | `INTEGER` | Yes | `NULL` | FK → `accounts.id` (for transfers) |
| `created_at` | `TIMESTAMPTZ` | No | `now()` | Transaction timestamp |

### Relationships

| Parent | Child | Cardinality | FK Column |
|---|---|---|---|
| `customers` | `accounts` | One-to-Many | `accounts.customer_id` |
| `accounts` | `transactions` | One-to-Many | `transactions.account_id` |
| `accounts` | `transactions` | One-to-Many (optional) | `transactions.related_account_id` |

### Indexes

| Table | Column(s) | Type | Purpose |
|---|---|---|---|
| `customers` | `id` | Primary Key | Row lookup |
| `customers` | `customer_code` | Unique Index | Fast lookup by code, uniqueness enforcement |
| `accounts` | `id` | Primary Key | Row lookup |
| `accounts` | `customer_id` | Index | Fast join on customer's accounts |
| `transactions` | `id` | Primary Key | Row lookup |
| `transactions` | `account_id` | Index | Fast join on account's transactions |
| `transactions` | `created_at` | Index | Efficient date-range filtering and ordering |

### Constraints

| Constraint | Table | Description |
|---|---|---|
| `customers.customer_code` UNIQUE | `customers` | No duplicate customer codes |
| `accounts.customer_id` FK | `accounts` | Must reference valid customer |
| `transactions.account_id` FK | `transactions` | Must reference valid account |
| `transactions.related_account_id` FK | `transactions` | Must reference valid account (when not NULL) |

---

## 7. Configuration

### Environment Variables

The backend loads configuration from a `.env` file in the `backend/` directory.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | `postgresql+asyncpg://postgres:postgres@localhost:5432/banking_db` | Async PostgreSQL connection string |
| `APP_NAME` | No | `Banking API` | Application name (displayed in OpenAPI docs) |

**.env.example:**
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/banking_db
```

### Database Configuration

- **Engine:** SQLAlchemy `create_async_engine` with `echo=False`
- **Session:** `async_sessionmaker` with `expire_on_commit=False` to allow post-commit attribute access
- **Dependency Injection:** `get_db()` async generator provides sessions to route handlers via FastAPI's `Depends()`

### CORS Configuration

Configured in `main.py` via FastAPI's `CORSMiddleware`:

```python
allow_origins=["*"]         # All origins (development only)
allow_credentials=True
allow_methods=["*"]         # All HTTP methods
allow_headers=["*"]         # All headers
```

### Development vs Production Notes

| Aspect | Current (Development) | Production Recommendation |
|---|---|---|
| Database init | Drops and recreates all tables on every startup | Use Alembic migrations |
| Seed data | Inserted automatically if DB is empty | Disable or use separate seed script |
| CORS | `allow_origins=["*"]` | Restrict to specific frontend domain |
| API base URL | Hardcoded `http://127.0.0.1:8000` | Environment variable / reverse proxy |
| Debug mode | Uvicorn with `--reload` | Uvicorn with multiple workers, no reload |
| HTTPS | Not configured | Required via reverse proxy (Nginx/Caddy) |

---

## 8. Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Git

### Database Setup

1. Install and start PostgreSQL.
2. Create the database:
   ```sql
   CREATE DATABASE banking_db;
   ```
3. Ensure the PostgreSQL user `postgres` has access (or update credentials in `.env`).

### Backend Setup

```bash
cd banking-app/backend

# Create and activate virtual environment
python -m venv venv
source venv/Scripts/activate    # Windows (Git Bash)
# source venv/bin/activate      # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment (optional — defaults work for local PostgreSQL)
cp .env.example .env
# Edit .env if your PostgreSQL credentials differ

# Start the server
uvicorn app.main:app --reload
```

The backend starts at `http://127.0.0.1:8000`. On first startup, it creates all tables and seeds development data automatically.

API documentation is available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### Frontend Setup

```bash
cd banking-app/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend starts at `http://localhost:5173`.

### Running Locally (Both Together)

1. Start PostgreSQL service.
2. In terminal 1: Start the backend (`uvicorn app.main:app --reload`).
3. In terminal 2: Start the frontend (`npm run dev`).
4. Open `http://localhost:5173` in a browser.

### Available Frontend Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve production build locally |

---

## 9. Future Enhancements

### Authentication and Authorization
- JWT-based authentication for API endpoints.
- Login/registration pages on the frontend.
- Token refresh mechanism.

### Role-Based Access Control
- Define roles: Admin, Teller, Customer.
- Admin: full CRUD on all entities.
- Teller: create transactions, view accounts.
- Customer: view own accounts and transactions only.

### Audit Logging
- Track all state-changing operations (create, update, delete) with timestamps and user identity.
- Immutable audit trail for regulatory compliance.

### Dockerization
- Dockerfile for backend (Python) and frontend (Node/Nginx).
- `docker-compose.yml` orchestrating backend, frontend, and PostgreSQL services.
- Single-command startup: `docker-compose up`.

### CI/CD Pipeline
- GitHub Actions or GitLab CI for automated testing, linting, and deployment.
- Automated database migrations on deploy.
- Environment-specific configuration (staging, production).

### Production Deployment
- Reverse proxy (Nginx or Caddy) for HTTPS termination and static file serving.
- Uvicorn with multiple workers behind Gunicorn.
- Connection pooling (PgBouncer) for database.
- Health check monitoring and alerting.

### Additional Features
- Account statements (PDF export).
- Transaction search by description or reference ID.
- Pagination for large transaction lists.
- Real-time notifications (WebSocket) for incoming transactions.
- Multi-currency support.
- Interest calculation and accrual.

---

## 10. Known Limitations

1. **No Authentication** — All API endpoints are publicly accessible. Any client can perform any operation.
2. **Database Reset on Startup** — The `init_db()` function drops and recreates all tables on every server restart. All data is lost between restarts.
3. **No Pagination** — All list endpoints return complete result sets. Performance will degrade with large datasets.
4. **Hardcoded Frontend API URL** — The Axios base URL (`http://127.0.0.1:8000`) is hardcoded, requiring a code change for different environments.
5. **No Input Sanitization Beyond Pydantic** — Relies solely on Pydantic for request validation. No additional sanitization for stored text fields.
6. **Single Currency** — All amounts are in INR with no multi-currency support.
7. **No Concurrent User Handling on Frontend** — No optimistic locking or conflict resolution for simultaneous operations.
8. **No Test Suite** — Neither backend nor frontend has automated tests.
9. **No Database Migrations** — Schema changes require a full database reset. Alembic is installed but not actively used.
10. **Development CORS Policy** — `allow_origins=["*"]` permits any origin, unsuitable for production.

---

## 11. Security Considerations

1. **Authentication Required** — Before production deployment, implement JWT or session-based authentication on all non-health endpoints.
2. **CORS Restriction** — Replace `allow_origins=["*"]` with the specific frontend domain.
3. **HTTPS Enforcement** — All traffic must be encrypted in production. Deploy behind a reverse proxy with TLS certificates.
4. **Environment Secrets** — Database credentials in `.env` must never be committed to version control. Use secrets management (AWS Secrets Manager, Vault) in production.
5. **SQL Injection** — Mitigated by SQLAlchemy's parameterized queries. No raw SQL is used.
6. **Input Validation** — Pydantic enforces type constraints and field limits on all request bodies. Additional validation (e.g., amount > 0, valid account type) is performed in the service layer.
7. **Rate Limiting** — Not implemented. Consider adding rate limiting (e.g., `slowapi`) to prevent abuse.
8. **Insufficient Funds Check** — The `withdraw` and `transfer` operations verify balance before proceeding. Transfer operations use `SELECT ... FOR UPDATE` to prevent race conditions.
9. **Logging** — Sensitive data (account balances, amounts) should not be logged in production. Review log levels before deployment.
10. **Dependency Auditing** — Regularly audit Python and Node.js dependencies for known vulnerabilities using `pip audit` and `npm audit`.

---

*Document generated for the Banking Application project. Last updated: March 2026.*
