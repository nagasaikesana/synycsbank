# Banking App — Project State

## Backend Architecture

### Tech Stack

| Package             | Version  |
| ------------------- | -------- |
| FastAPI             | 0.115.6  |
| Uvicorn             | 0.34.0   |
| SQLAlchemy (async)  | 2.0.36   |
| asyncpg             | 0.30.0   |
| Pydantic            | 2.10.4   |
| Pydantic-Settings   | 2.7.1    |
| Alembic             | 1.14.1   |
| python-dotenv       | 1.0.1    |

- **Database**: PostgreSQL (localhost:5432/banking_db)
- **Server**: Uvicorn (ASGI)
- **ORM**: SQLAlchemy 2.0 async with declarative models

### Directory Structure

```
backend/
├── .env
├── .env.example
├── requirements.txt
└── app/
    ├── __init__.py
    ├── config.py
    ├── database.py
    ├── exceptions.py
    ├── main.py
    ├── models/
    │   ├── __init__.py
    │   ├── account.py
    │   └── transaction.py
    ├── routers/
    │   ├── __init__.py
    │   ├── accounts.py
    │   └── transactions.py
    ├── schemas/
    │   ├── __init__.py
    │   ├── account.py
    │   └── transaction.py
    └── services/
        ├── __init__.py
        ├── account_service.py
        └── transaction_service.py
```

### Database Models

#### Account (`accounts` table)

| Column        | Type           | Constraints                    |
| ------------- | -------------- | ------------------------------ |
| id            | int            | Primary key, indexed           |
| holder_name   | String(255)    | Required                       |
| account_type  | Enum           | "current" or "savings"         |
| balance       | Numeric(15,2)  | Default 0.00                   |
| interest_rate | Numeric(5,2)   | Required, set on creation      |

Interest rate valid ranges:
- Current: 2.0% – 4.0%
- Savings: 6.0% – 8.0%

Default rates on creation: Savings = 7.0%, Current = 3.0%

#### Transaction (`transactions` table)

| Column             | Type           | Constraints                          |
| ------------------ | -------------- | ------------------------------------ |
| id                 | int            | Primary key, indexed                 |
| account_id         | int            | FK → accounts.id, indexed            |
| transaction_type   | Enum           | deposit, withdrawal, transfer_in, transfer_out |
| amount             | Numeric(15,2)  | Required                             |
| balance_after      | Numeric(15,2)  | Required                             |
| related_account_id | int \| None    | FK → accounts.id, nullable           |
| created_at         | DateTime (tz)  | server_default=now(), indexed        |

### API Endpoints

#### Accounts (`/api/accounts`)

| Method | Path                          | Purpose              | Status |
| ------ | ----------------------------- | -------------------- | ------ |
| POST   | `/api/accounts/`              | Create account       | 201    |
| GET    | `/api/accounts/`              | List all accounts    | 200    |
| GET    | `/api/accounts/{account_id}`  | Get account details  | 200    |
| PATCH  | `/api/accounts/{account_id}`  | Update account       | 200    |
| DELETE | `/api/accounts/{account_id}`  | Delete account       | 204    |

#### Transactions (`/api/accounts/{account_id}`)

| Method | Path                                        | Purpose            | Status |
| ------ | ------------------------------------------- | ------------------ | ------ |
| POST   | `/api/accounts/{account_id}/deposit`        | Deposit funds      | 200    |
| POST   | `/api/accounts/{account_id}/withdraw`       | Withdraw funds     | 200    |
| POST   | `/api/accounts/{account_id}/transfer`       | Transfer funds     | 200    |
| GET    | `/api/accounts/{account_id}/transactions`   | Daily history      | 200    |

#### Health

| Method | Path      | Response           |
| ------ | --------- | ------------------ |
| GET    | `/health` | `{"status": "ok"}` |

### Services

#### AccountService

- `create(data)` — Creates account with default interest rate based on type
- `get_by_id(account_id)` — Fetches account or raises 404
- `get_all()` — Lists all accounts ordered by ID
- `update(account_id, data)` — Updates holder_name/interest_rate with validation
- `delete(account_id)` — Deletes account or raises 404

#### TransactionService

- `deposit(account_id, amount)` — Adds funds, validates amount > 0
- `withdraw(account_id, amount)` — Removes funds, checks sufficient balance
- `transfer(from_id, to_id, amount)` — Transfers between accounts with row-level locking (sorted ID order to prevent deadlocks)
- `get_daily_history(account_id, day)` — Returns transactions for a specific date

### Exception Handling

| Exception                | Status | Message                              |
| ------------------------ | ------ | ------------------------------------ |
| AccountNotFoundError     | 404    | "Account {id} not found"             |
| InsufficientFundsError   | 400    | "Insufficient funds"                 |
| InvalidAmountError       | 400    | "Amount must be greater than zero"   |
| SameAccountTransferError | 400    | "Cannot transfer to the same account"|

### Middleware & Startup

- **CORS**: All origins, methods, and headers allowed (development config)
- **Lifespan startup**: `init_db()` → `seed_accounts()` (inserts 6 sample accounts if table is empty)
- **Seed accounts** (dev only): Aarav Sharma, Priya Patel, Rohan Mehta, Ananya Iyer, Vikram Reddy, Sneha Gupta

---

## Frontend Architecture

### Tech Stack

| Package          | Version          |
| ---------------- | ---------------- |
| React            | ^19.2.0          |
| React DOM        | ^19.2.0          |
| React Router DOM | ^7.13.1          |
| Axios            | ^1.13.6          |
| Vite             | ^8.0.0-beta.13   |
| TypeScript       | ~5.9.3           |

### Directory Structure

```
frontend/
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── index.html
├── public/
│   └── vite.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   └── index.css
    ├── components/       (empty)
    ├── pages/            (empty)
    └── services/         (empty)
```

### Current State

- **main.tsx**: Entry point — mounts `<App />` in StrictMode, imports global CSS
- **App.tsx**: Placeholder component — renders "Banking App" heading and "Frontend is ready." text
- **styles/index.css**: Global reset, body styling (Inter font, light gray background), centered `.app` container (max-width 960px)
- **components/**: Empty — ready for reusable UI components
- **pages/**: Empty — ready for page-level components
- **services/**: Empty — ready for API service modules

### Scripts

| Command         | Action                           |
| --------------- | -------------------------------- |
| `npm run dev`   | Start Vite dev server            |
| `npm run build` | Type-check + production build    |
| `npm run lint`  | Run ESLint                       |
| `npm run preview` | Preview production build       |

---

## Project Status

- **Backend**: Fully functional with all CRUD operations, transactions, transfer logic, and dev seed data
- **Frontend**: Clean scaffold with routing and HTTP client installed but not yet wired up; empty component/page/service directories ready for feature development
