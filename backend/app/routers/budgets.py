from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models import Budget, Transaction, User
from app.schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == target_month,
            Budget.year == target_year,
        )
        .all()
    )

    # Calculate actual spending per category for this month
    transactions = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("spent")
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            extract("month", Transaction.transaction_date) == target_month,
            extract("year", Transaction.transaction_date) == target_year,
        )
        .group_by(Transaction.category)
        .all()
    )

    spent_by_category = {t[0]: Decimal(str(t[1])) for t in transactions}

    results = []
    for b in budgets:
        spent = spent_by_category.get(b.category, Decimal("0.00"))
        remaining = b.amount - spent
        pct = float((spent / b.amount) * 100) if b.amount > 0 else 0.0

        item = BudgetResponse(
            id=b.id,
            user_id=b.user_id,
            category=b.category,
            amount=b.amount,
            month=b.month,
            year=b.year,
            spent=spent,
            remaining=remaining,
            percentage=round(pct, 1),
        )
        results.append(item)

    return results


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category.strip(),
        Budget.month == budget_in.month,
        Budget.year == budget_in.year,
    ).first()

    if existing:
        existing.amount = budget_in.amount
        db.commit()
        db.refresh(existing)
        target_budget = existing
    else:
        new_b = Budget(
            user_id=current_user.id,
            category=budget_in.category.strip(),
            amount=budget_in.amount,
            month=budget_in.month,
            year=budget_in.year,
        )
        db.add(new_b)
        db.commit()
        db.refresh(new_b)
        target_budget = new_b

    # Calculate spending
    spent_res = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.category == target_budget.category,
        extract("month", Transaction.transaction_date) == target_budget.month,
        extract("year", Transaction.transaction_date) == target_budget.year,
    ).scalar() or Decimal("0.00")

    spent = Decimal(str(spent_res))
    remaining = target_budget.amount - spent
    pct = float((spent / target_budget.amount) * 100) if target_budget.amount > 0 else 0.0

    return BudgetResponse(
        id=target_budget.id,
        user_id=target_budget.user_id,
        category=target_budget.category,
        amount=target_budget.amount,
        month=target_budget.month,
        year=target_budget.year,
        spent=spent,
        remaining=remaining,
        percentage=round(pct, 1),
    )


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")

    if budget_in.amount is not None:
        budget.amount = budget_in.amount

    db.commit()
    db.refresh(budget)

    spent_res = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.category == budget.category,
        extract("month", Transaction.transaction_date) == budget.month,
        extract("year", Transaction.transaction_date) == budget.year,
    ).scalar() or Decimal("0.00")

    spent = Decimal(str(spent_res))
    remaining = budget.amount - spent
    pct = float((spent / budget.amount) * 100) if budget.amount > 0 else 0.0

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        category=budget.category,
        amount=budget.amount,
        month=budget.month,
        year=budget.year,
        spent=spent,
        remaining=remaining,
        percentage=round(pct, 1),
    )


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found.")

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully."}

