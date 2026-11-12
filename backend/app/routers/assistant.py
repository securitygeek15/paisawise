from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal
import os
import httpx
from app.database import get_db
from app.models import Transaction, Budget, SavingsGoal, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


class AssistantQuery(BaseModel):
    query: str


class AssistantResponse(BaseModel):
    reply: str
    engine: str = "local"
    data_context: Optional[Dict[str, Any]] = None


def check_ollama_status() -> Dict[str, Any]:
    """Checks if a local Ollama instance is active on the machine."""
    try:
        with httpx.Client(timeout=0.6) as client:
            resp = client.get(f"{OLLAMA_HOST}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                active_model = OLLAMA_MODEL if OLLAMA_MODEL in models else (models[0] if models else OLLAMA_MODEL)
                return {"available": True, "model": active_model, "models": models}
    except Exception:
        pass
    return {"available": False, "model": "builtin-local-engine", "models": []}


@router.get("/engine-status")
def get_engine_status():
    ollama_info = check_ollama_status()
    if ollama_info["available"]:
        return {
            "mode": "local_llm",
            "name": f"Ollama ({ollama_info['model']})",
            "is_local": True,
            "description": "Running 100% locally on your machine via Ollama.",
            "available_models": ollama_info["models"],
        }
    return {
        "mode": "builtin_local",
        "name": "Built-in Local Finance Engine",
        "is_local": True,
        "description": "Running 100% on-device with verified SQL calculations. Zero cloud dependencies.",
        "available_models": [],
    }


def query_local_ollama(prompt: str, system_context: str, model_name: str) -> Optional[str]:
    """Runs inference against local Ollama running on user's machine."""
    try:
        full_system = (
            "You are PaisaWise AI, a local, privacy-first personal finance assistant. "
            "You answer questions ONLY using the user's verified financial data provided below. "
            "Never invent or hallucinate financial transactions. Keep answers concise, factual, and minimal.\n\n"
            f"User Financial Records:\n{system_context}"
        )
        payload = {
            "model": model_name,
            "prompt": prompt,
            "system": full_system,
            "stream": False,
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(f"{OLLAMA_HOST}/api/generate", json=payload)
            if resp.status_code == 200:
                result = resp.json()
                return result.get("response", "").strip()
    except Exception:
        pass
    return None


@router.post("/chat", response_model=AssistantResponse)
def ask_assistant(
    payload: AssistantQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = payload.query.lower().strip()
    today = date.today()

    # 1. Gather verified local user financial context
    month_txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            extract("month", Transaction.transaction_date) == today.month,
            extract("year", Transaction.transaction_date) == today.year,
        )
        .all()
    )

    monthly_income = sum((t.amount for t in month_txs if t.type == "income"), Decimal("0.00"))
    monthly_expense = sum((t.amount for t in month_txs if t.type == "expense"), Decimal("0.00"))

    cat_expenses: Dict[str, Decimal] = {}
    for t in month_txs:
        if t.type == "expense":
            cat_expenses[t.category] = cat_expenses.get(t.category, Decimal("0.00")) + t.amount

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == today.month,
            Budget.year == today.year,
        )
        .all()
    )

    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()

    # Format context string for local inference
    context_lines = [
        f"Month: {today.strftime('%B %Y')}",
        f"Monthly Income: ₹{monthly_income:,.2f}",
        f"Monthly Expenses: ₹{monthly_expense:,.2f}",
        f"Net Savings: ₹{(monthly_income - monthly_expense):,.2f}",
        f"Expense Categories: {', '.join([f'{c}: ₹{a:,.2f}' for c, a in cat_expenses.items()]) or 'None'}",
        f"Active Budgets: {', '.join([f'{b.category}: limit ₹{b.amount:,.2f}' for b in budgets]) or 'None'}",
        f"Savings Goals: {', '.join([f'{g.name}: ₹{g.current_amount:,.2f} of ₹{g.target_amount:,.2f}' for g in goals]) or 'None'}",
    ]
    financial_context = "\n".join(context_lines)

    # 2. Check if local Ollama model is available
    ollama_info = check_ollama_status()
    if ollama_info["available"]:
        llm_reply = query_local_ollama(payload.query, financial_context, ollama_info["model"])
        if llm_reply:
            return AssistantResponse(
                reply=llm_reply,
                engine=f"Local LLM ({ollama_info['model']})",
                data_context={"income": float(monthly_income), "expenses": float(monthly_expense)},
            )

    # 3. Fallback: Local Deterministic Financial NLP Engine (100% on-device, instant, zero dependencies)
    if any(k in query for k in ["where did my money go", "where did most", "top expense", "most spent", "highest spend", "spend most"]):
        if not cat_expenses:
            return AssistantResponse(
                reply="You haven't recorded any expenses for this month yet. Add your transactions to start tracking spending categories.",
                engine="Local Built-in Engine",
            )
        sorted_cats = sorted(cat_expenses.items(), key=lambda x: x[1], reverse=True)
        top_cat, top_amt = sorted_cats[0]
        pct = round(float((top_amt / monthly_expense) * 100), 1) if monthly_expense > 0 else 0
        details = ", ".join([f"{c} (₹{a:,.2f})" for c, a in sorted_cats[:3]])
        return AssistantResponse(
            reply=(
                f"Most of your money this month went towards **{top_cat}**, totaling ₹{top_amt:,.2f} ({pct}% of all expenses).\n\n"
                f"Your top spending categories are: {details}."
            ),
            engine="Local Built-in Engine",
            data_context={"top_category": top_cat, "amount": float(top_amt), "breakdown": {c: float(a) for c, a in sorted_cats[:5]}}
        )

    elif any(k in query for k in ["summary", "overview", "how am i doing", "status", "monthly finances"]):
        savings = monthly_income - monthly_expense
        savings_rate = round(float((savings / monthly_income) * 100), 1) if monthly_income > 0 else 0.0
        return AssistantResponse(
            reply=(
                f"Here is your financial summary for {today.strftime('%B %Y')}:\n\n"
                f"• **Income:** ₹{monthly_income:,.2f}\n"
                f"• **Expenses:** ₹{monthly_expense:,.2f}\n"
                f"• **Net Savings:** ₹{savings:,.2f} ({savings_rate}% savings rate)\n"
                f"• **Transactions Recorded:** {len(month_txs)}"
            ),
            engine="Local Built-in Engine",
            data_context={
                "income": float(monthly_income),
                "expenses": float(monthly_expense),
                "savings": float(savings),
                "savings_rate": savings_rate,
            }
        )

    elif any(k in query for k in ["budget", "over budget", "limits", "adjust"]):
        if not budgets:
            return AssistantResponse(
                reply="You don't have any budgets configured for this month. Head to the Budgets tab to allocate spending limits.",
                engine="Local Built-in Engine",
            )
        over_budget = []
        close_to_budget = []
        for b in budgets:
            spent = cat_expenses.get(b.category, Decimal("0.00"))
            pct = float((spent / b.amount) * 100) if b.amount > 0 else 0
            if spent > b.amount:
                over_budget.append(f"{b.category} (exceeded by ₹{spent - b.amount:,.2f})")
            elif pct >= 85:
                close_to_budget.append(f"{b.category} ({pct:.0f}% used)")

        if over_budget:
            reply = f"Budget Alert: You have exceeded your budget in: {', '.join(over_budget)}. Consider reducing non-essential expenses this week."
        elif close_to_budget:
            reply = f"You are close to your limits in: {', '.join(close_to_budget)}. All other categories are within limits."
        else:
            reply = f"Great financial discipline. All {len(budgets)} of your monthly budgets are currently within healthy limits."

        return AssistantResponse(reply=reply, engine="Local Built-in Engine")

    elif any(k in query for k in ["save", "savings goal", "emergency fund", "goals"]):
        if not goals:
            return AssistantResponse(
                reply="You haven't set up any savings goals yet. Create one in the Savings tab to track progress.",
                engine="Local Built-in Engine",
            )
        goals_text = "\n".join([
            f"• **{g.name}**: ₹{g.current_amount:,.2f} / ₹{g.target_amount:,.2f} ({round(float(g.current_amount/g.target_amount*100), 1) if g.target_amount > 0 else 0}%)"
            for g in goals
        ])
        return AssistantResponse(
            reply=f"Here is your current savings goal progress:\n\n{goals_text}",
            engine="Local Built-in Engine",
        )

    # Dynamic category queries e.g. "how much did i spend on food"
    for cat in cat_expenses:
        if cat.lower() in query:
            spent = cat_expenses[cat]
            return AssistantResponse(
                reply=f"You have spent **₹{spent:,.2f}** on **{cat}** this month.",
                engine="Local Built-in Engine",
                data_context={"category": cat, "spent": float(spent)},
            )

    return AssistantResponse(
        reply=(
            f"I am your local on-device financial assistant running completely on your machine.\n\n"
            f"Try asking:\n"
            f"• *'Where did most of my money go this month?'*\n"
            f"• *'Summarize my monthly finances.'*\n"
            f"• *'Am I over budget on any category?'*\n"
            f"• *'What is my savings progress?'*\n"
            f"• *'How much did I spend on Food?'*"
        ),
        engine="Local Built-in Engine",
    )
