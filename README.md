# PaisaWise

A minimalist personal finance management platform designed to help track income and expenses, set monthly budgets, manage recurring subscriptions, monitor savings goals, and view financial analytics.

## Main Features

- Overview Dashboard: Centralized view of total balance, monthly income, expenses, net savings, daily spending trends, and calculated financial insights.
- Transactions Management: Add, edit, delete, search, filter by category/type/date, and sort financial records.
- Category Budgets: Set monthly spending caps by category with visual warnings when nearing or exceeding limits.
- Savings Goals: Track savings targets with completion dates and deposit contributions.
- Recurring Payments: Monitor recurring subscriptions with normalized monthly expenditure estimates.
- Insights & Analytics: View cash flow trends, category-wise breakdowns, daily average expenditure, and savings rate.
- Data Export: Export transactions to CSV or download a complete system backup as JSON.
- AI Financial Assistant: Privacy-preserving assistant querying recorded financial data to answer spending and budget questions.

## How to Run

### Option 1: Docker (Recommended)

Run both frontend and backend using Docker Compose:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Option 2: Local Setup

#### Prerequisites
- Python 3.11+
- Node.js 20+

#### 1. Backend

```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

The backend API will run on http://localhost:8000.

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:3000.

#### Demo Account
Click "Explore Instant Demo Account" on the login screen to load preconfigured sample data.
