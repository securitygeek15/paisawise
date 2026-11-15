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

## Highlight Feature: Smart Buy & Price History Oracle

PaisaWise includes a built-in decision engine that bridges e-commerce shopping with personal financial reality:

- Product Link Analysis: Paste any product URL from Amazon or Flipkart directly into the app.
- Live Retail Extraction: Directly extracts live product pricing, clean titles, and platform metadata from Amazon and Flipkart using verified DOM/JSON-LD scrapers.
- 6-Month Price History: Visualizes historical price fluctuations, tracking all-time lows, averages, and peak pricing to verify if a sale discount is genuine.
- Market Timing Verdict: Classifies current pricing as Optimal (near all-time low), Overpriced (wait for next sale), or Fair Value.
- Personal Reality Check: Calculates the purchase price in actual hours of work based on your net income, and computes your remaining safe daily spending allowance while keeping upcoming recurring bills protected.
- Manual Adjustment: Allows manual price tuning to account for specific variants, accessories, or regional on-road fees.

---

## Main Features

- Smart Buy & Price History Oracle: Evaluate product URLs against real historical trends and personal cashflow.
- Chrome Extension (Manifest V3): Direct browser overlay and toolbar popup for Amazon and Flipkart that checks price drops, timing verdicts, and personal readiness in one click.
- Overview Dashboard: Centralized view of total balance, monthly income, expenses, net savings, daily spending trends, and calculated financial insights.
- Transactions Management: Add, edit, delete, search, filter by category/type/date, and sort financial records.
- Category Budgets: Set monthly spending caps by category with visual warnings when nearing or exceeding limits.
- Savings Goals: Track savings targets with completion dates and deposit contributions.
- Recurring Payments: Monitor recurring subscriptions with normalized monthly expenditure estimates.
- Insights & Analytics: View cash flow trends, category-wise breakdowns, daily average expenditure, and savings rate.
- Data Export: Export transactions to CSV or download a complete system backup as JSON.
- 100% Local AI Financial Assistant: Runs entirely on your machine using the built-in deterministic analytics engine. Zero cloud accounts, external API keys, or data sharing. Optional: users can connect a local Ollama model if desired (ENABLE_OLLAMA=true).

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

## Chrome Extension Setup

Evaluate products directly while browsing Amazon (`amazon.in`, `amazon.com`) and Flipkart (`flipkart.com`).

### Install from GitHub Releases
1. Download `paisawise-extension.zip` from the latest [GitHub Releases](https://github.com/securitygeek15/paisawise/releases).
2. Unzip the downloaded file to a local folder.
3. In Google Chrome, Brave, or Microsoft Edge, navigate to `chrome://extensions/`.
4. Enable the **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked** in the top-left corner and select the extracted folder (or the `extension` directory from this repository).
6. Open any product page on Amazon or Flipkart to inspect price dips, timing verdicts, and your work-hours reality check via the floating drawer.

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
