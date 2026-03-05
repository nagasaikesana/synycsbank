# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack banking app: React/TypeScript frontend consuming a FastAPI/PostgreSQL backend. This is the **frontend** directory. The backend lives at `../backend/`.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # TypeScript type-check (tsc -b) + Vite production build
npm run lint       # ESLint (flat config, ESLint 9+)
npm run preview    # Serve production build locally
npx tsc --noEmit   # Type-check only (no build output)
```

No test runner is configured.

## Architecture

### Routing (React Router DOM v7)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Redirect → `/customers` | |
| `/customers` | `CustomersPage` | List all customers |
| `/customers/:id` | `CustomerAccountsPage` | Customer info + their accounts |
| `/accounts/:id/transactions` | `TransactionsPage` | Account transactions with filtering |

`BrowserRouter` is in `main.tsx`, route definitions in `App.tsx`.

### Data Flow

- No global state (no Redux/Zustand/Context). Each page owns its state via `useState` + `useEffect`.
- `src/services/api.ts` — Axios instance hardcoded to `http://127.0.0.1:8000`. Pages call `api.get()`/`api.post()` directly.
- `src/types.ts` — TypeScript interfaces (`Customer`, `Account`, `Transaction`) mirroring backend Pydantic schemas.

### Styling

Single CSS file at `src/styles/index.css` — plain CSS, no framework. Responsive breakpoint at 640px.

### Backend API Endpoints Used

- `GET /api/customers/` — list customers
- `GET /api/customers/:id` — customer detail
- `GET /api/customers/:id/accounts` — customer's accounts
- `GET /api/accounts/:id` — account detail
- `GET /api/accounts/:id/transactions?from_date=&to_date=&type=&preset_range=` — filtered transactions

### Key Conventions

- Currency formatting uses `toLocaleString("en-IN")` with `minimumFractionDigits: 2` and ₹ symbol.
- Transaction types are `"credit"` | `"debit"`. Amounts are strings from the API (Decimal serialization), converted to `Number()` for display.
- The `running_balance` field (= `balance_after`) represents the account balance immediately after each transaction.
- Filter presets (`this_month`, `last_2_months`, `last_90_days`, `last_6_months`, `last_1_year`) are sent as `preset_range` query param; the backend resolves dates server-side.

## Backend Quick Reference

```bash
cd ../backend
source venv/Scripts/activate    # Windows
uvicorn app.main:app --reload   # Starts at http://127.0.0.1:8000
```

The backend drops and recreates all tables on every startup (dev mode) and seeds 6 customers, 10 accounts, 20 transactions. No migrations — schema changes require a server restart.
