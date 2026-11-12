# PaisaWise — Minimalist Personal Finance Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-black?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-black?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.13+-black?style=flat-square&logo=python)](https://python.org)
[![CI](https://img.shields.io/badge/CI-Passing-black?style=flat-square&logo=githubactions)](.github/workflows/ci.yml)

**Less interface. More clarity.**

A production-grade, monochromatic, light-themed personal finance management platform designed to help students, freelancers, and working professionals understand, organize, and master their capital.

[Key Features](#-key-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Design System](#-design-system)

</div>

---

## 🏛️ Layout Architecture

```text
┌───────────────────┬────────────────────────────────────────────────────────┐
│                   │ Good morning, Aarav.                      [Nov 2026 ▾] │
│     PaisaWise     │ Here's your financial overview.           [+ Add Record]│
│   [ Finance OS ]  ├─────────────┬─────────────┬─────────────┬──────────────┤
│                   │TOTAL BALANCE│ MONTHLY INC │ MONTHLY EXP │ NET SAVINGS  │
│ 1. Overview       │ ₹1,61,342   │  ₹1,13,500  │   ₹47,158   │   ₹66,342    │
│ 2. Transactions   ├─────────────┴─────────────┴─────────────┴──────────────┤
│ 3. Budgets        │ SPENDING TREND OVER TIME (Monochrome Area Chart)       │
│ 4. Savings        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ 5. Recurring      ├────────────────────────────┬───────────────────────────┤
│ 6. Insights       │ RECENT TRANSACTIONS (Top 5)│ CATEGORY BUDGETS          │
│ 7. Settings       │ • Swiggy       ₹1,150 [UPI]│ • Housing & Rent (100%)   │
│                   │ • Fuel Refill  ₹3,200 [Card│ • Groceries & Food (62%)  │
│ [✦ AI Assistant]  ├────────────────────────────┴───────────────────────────┤
│ [👤 Profile (INR)]│ CALCULATED OBSERVATIONS: "Rent accounts for 46% of exp"│
└───────────────────┴────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **📊 Overview Dashboard**: Visual focal-point balance tracking, live monthly inflows, outflows, retention rates, and real statistical insights calculated directly from records.
- **💳 Transaction Management**: Add, edit, delete, and paginate entries with debounced full-text search, multi-field filters, and automated summary calculations.
- **🎯 Category Budgeting**: Establish strict monthly category limits with dynamic real-time progress bars and alerts when nearing ($\ge 85\%$) or exceeding limits ($\ge 100\%$).
- **💎 Goal Milestones**: Configure capital accumulation targets (Emergency Fund, Workstation, Vacation) with target dates and interactive `+ Contribute` actions.
- **🔄 Recurring Payments & Reminders**: Track weekly, monthly, quarterly, and annual subscriptions with normalized monthly outflow forecasts.
- **📈 Quantitative Insights**: Comprehensive 12-month cash-flow history, ranked category distributions, and daily burn-rate metrics.
- **🔒 Security & Portability**: Direct CSV export for spreadsheets, complete JSON data backups, bcrypt authentication, and one-click account purging.
- **🤖 Modular Financial Assistant**: Future-ready AI assistant querying real database records to answer questions without hallucination or third-party data leakage.

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

Run the full stack with a single command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Local Development

#### Prerequisites
- Node.js 20+ & npm
- Python 3.13+

#### 1. Start the FastAPI Backend
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> 💡 **Instant Demo Account**: Click **"Explore Instant Demo Account"** on the sign-in modal to immediately explore a pre-populated workspace with realistic Indian fintech data.

---

## 🧪 Testing & Verification

Run the automated test suites:

```bash
# Run backend pytest suite
cd backend
.\venv\Scripts\pytest tests/test_api.py -v

# Run live end-to-end integration check
python tests/live_e2e_check.py

# Run frontend production build & typecheck
cd ../frontend
npm run build
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT |
| `POST` | `/api/auth/demo` | Seed & sign into instant demo account |
| `GET` | `/api/transactions` | Paginated, filtered, and sorted transactions |
| `POST` | `/api/transactions` | Record new income or expense |
| `PUT` | `/api/transactions/{id}` | Update existing transaction record |
| `DELETE` | `/api/transactions/{id}` | Delete transaction record |
| `GET` | `/api/budgets` | Fetch monthly category limits & current spending |
| `POST` | `/api/budgets` | Create or update category budget limit |
| `GET` | `/api/savings` | Retrieve savings goals & milestones |
| `POST` | `/api/savings/{id}/contribute`| Deposit funds into a savings goal |
| `GET` | `/api/recurring` | List recurring payments & monthly outflow forecast |
| `GET` | `/api/analytics/overview` | Overall balance, spending trend, & insights |
| `GET` | `/api/analytics/deep` | Annual cashflow dynamics & category shares |
| `POST` | `/api/assistant/chat` | AI query engine over verified database records |
| `GET` | `/api/settings/export/csv` | Download complete transaction history as CSV |
| `GET` | `/api/settings/export/summary-json` | Download full database backup as JSON |

---

## 🎨 Design System

| Element | Value | Purpose |
|---|---|---|
| **Background** | `#FAFAFA` | Neutral canvas backdrop |
| **Surface** | `#FFFFFF` | Card & table surface |
| **Primary Text** | `#171717` | High-contrast editorial typography |
| **Secondary Text** | `#737373` | Subtitles & metadata labels |
| **Muted Text** | `#A3A3A3` | Hints & placeholders |
| **Borders** | `#EAEAEA` | 1px subtle boundary delineation |
| **Primary Button** | `#171717` | Clean solid action button |

---

## 🛡️ Financial Integrity & Security

1. **No Floating-Point Math**: Monetary figures use `Numeric(12, 2)` / Python `Decimal` across all calculations.
2. **Strict Data Isolation**: Every database query is scoped to `current_user.id`.
3. **Cryptographic Hashing**: User passwords are encrypted with salted `bcrypt`.
4. **Privacy First**: Sensitive financial records are never forwarded to third-party LLMs without user consent.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
