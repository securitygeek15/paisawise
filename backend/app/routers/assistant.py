from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List, Dict, Any
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models import Transaction, Budget, SavingsGoal, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class AssistantQuery(BaseModel):
    query: str


class AssistantResponse(BaseModel):
    reply: str
    data_context: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=AssistantResponse)
def ask_assistant(
    payload: AssistantQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = payload.query.lower().strip()
    today = date.today()

    # Fetch current month transactions
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

    # Category breakdown
    cat_expenses: Dict[str, Decimal] = {}
    for t in month_txs:
        if t.type == "expense":
            cat_expenses[t.category] = cat_expenses.get(t.category, Decimal("0.00")) + t.amount

    # Budgets
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == today.month,
            Budget.year == today.year,
        )
        .all()
    )

    # Deterministic query routing on verified user data
    if any(k in query for k in ["where did my money go", "where did most", "top expense", "most spent", "highest spend"]):
        if not cat_expenses:
            return AssistantResponse(
                reply="You haven't recorded any expenses for this month yet. Add your transactions to start tracking spending categories.",
            )
        sorted_cats = sorted(cat_expenses.items(), key=lambda x: x[1], reverse=True)
        top_cat, top_amt = sorted_cats[0]
        pct = round(float((top_amt / monthly_expense) * 100), 1) if monthly_expense > 0 else 0
        details = ", ".join([f"{c} (₹{a:,.2f})" for c, a in sorted_cats[:3]])
        return AssistantResponse(
            reply=(
                f"Most of your money this month went towards **{top_cat}**, totaling ₹{top_amt:,.2f} ({pct}% of all expenses). "
                f"Your top 3 spending categories are: {details}."
            ),
            data_context={"top_category": top_cat, "amount": float(top_amt), "breakdown": {c: float(a) for c, a in sorted_cats[:5]}}
        )

    elif any(k in query for k in ["summary", "overview", "how am i doing", "status", "monthly finances"]):
        savings = monthly_income - monthly_expense
        savings_rate = round(float((savings / monthly_income) * 100), 1) if monthly_income > 0 else 0.0
        return AssistantResponse(
            reply=(
                f"Here is your financial summary for this month:\n"
                f"• **Income:** ₹{monthly_income:,.2f}\n"
                f"• **Expenses:** ₹{monthly_expense:,.2f}\n"
                f"• **Net Savings:** ₹{savings:,.2f} ({savings_rate}% savings rate)\n"
                f"You have recorded {len(month_txs)} transactions so far this month."
            ),
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
            reply = f"Warning: You have exceeded your budget in: {', '.join(over_budget)}. Consider reducing discretionary expenses this week."
        elif close_to_budget:
            reply = f"You are close to your limits in: {', '.join(close_to_budget)}. All other categories are within limits."
        else:
            reply = f"Great discipline! All {len(budgets)} of your monthly budgets are currently within healthy limits."

        return AssistantResponse(reply=reply)

    elif any(k in query for k in ["save", "savings goal", "emergency fund", "goals"]):
        goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
        if not goals:
            return AssistantResponse(reply="You haven't set up any savings goals yet. Create one in the Savings tab to track progress!")
        goals_text = "\n".join([
            f"• **{g.name}**: ₹{g.current_amount:,.2f} / ₹{g.target_amount:,.2f} ({round(float(g.current_amount/g.target_amount*100), 1) if g.target_amount > 0 else 0}%)"
            for g in goals
        ])
        return AssistantResponse(
            reply=f"Here is your current savings progress:\n{goals_text}"
        )

    else:
        return AssistantResponse(
            reply=(
                f"I can analyze your verified financial records. Try asking:\n"
                f"• *'Where did most of my money go this month?'*\n"
                f"• *'Summarize my monthly finances.'*\n"
                f"• *'Am I over budget on any category?'*\n"
                f"• *'What is my savings progress?'*"
            )
        )

