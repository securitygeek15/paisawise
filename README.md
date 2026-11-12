<div align="center">
  <img src="logo.svg" width="68" height="68" alt="PaisaWise Logo" />
  <h1>PaisaWise</h1>
  <p>Minimalist personal finance management platform.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-171717?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-171717?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-171717?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-171717?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Python-3.13-171717?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Docker-Enabled-171717?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/License-MIT-171717?style=flat-square" alt="License" />
  </p>
</div>

---

## Main Features

- "Can I Afford This?" (Impulse Buy Simulator): Live simulation evaluating planned purchases against upcoming rent, scheduled bills, remaining daily allowance, and cost in working hours.
- Overview Dashboard: Centralized view of total balance, monthly income, expenses, net savings, daily spending trends, and calculated financial insights.
- Transactions Management: Add, edit, delete, search, filter by category/type/date, and sort financial records.
- Category Budgets: Set monthly spending caps by category with visual warnings when nearing or exceeding limits.
- Savings Goals: Track savings targets with completion dates and deposit contributions.
- Recurring Payments: Monitor recurring subscriptions with normalized monthly expenditure estimates.
- Insights & Analytics: View cash flow trends, category-wise breakdowns, daily average expenditure, and savings rate.
- Data Export: Export transactions to CSV or download a complete system backup as JSON.
- AI Financial Assistant: Privacy-preserving assistant querying recorded financial data to answer spending and budget questions.

## How to Run

### Option 1: One Command (Recommended)

Run both backend and frontend together with a single command:

```bash
npm run dev
```

Or using Python:

```bash
python run.py
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Option 2: Docker

Run with Docker Compose:

```bash
docker compose up --build
```

---

### Option 3: Separate Terminals

#### 1. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # or source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Demo Account
Click "Explore Instant Demo Account" on the login screen to load preconfigured sample data.
