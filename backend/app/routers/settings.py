from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
import csv
import io
import json
from decimal import Decimal
from app.database import get_db
from app.models import User, Transaction, Budget, SavingsGoal, RecurringPayment
from app.schemas import UserUpdate, UserResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_in.email and user_in.email.lower() != current_user.email:
        existing = db.query(User).filter(User.email == user_in.email.lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail="This email is already in use.")
        current_user.email = user_in.email.lower().strip()

    if user_in.name:
        current_user.name = user_in.name.strip()

    if user_in.currency:
        current_user.currency = user_in.currency.strip().upper()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/export/csv")
def export_transactions_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Date", "Name", "Type", "Category",
        "Amount", "Currency", "Payment Method", "Notes"
    ])

    for t in txs:
        writer.writerow([
            t.id,
            t.transaction_date.isoformat(),
            t.name,
            t.type,
            t.category,
            f"{t.amount:.2f}",
            current_user.currency,
            t.payment_method,
            t.notes or "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=paisawise_transactions_{current_user.id}.csv"
        },
    )


@router.get("/export/summary-json")
def export_financial_summary_json(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()
    recurring = db.query(RecurringPayment).filter(RecurringPayment.user_id == current_user.id).all()

    payload = {
        "user": {
            "name": current_user.name,
            "email": current_user.email,
            "currency": current_user.currency,
            "joined_at": current_user.created_at.isoformat(),
        },
        "transactions_count": len(txs),
        "transactions": [
            {
                "id": t.id,
                "name": t.name,
                "amount": float(t.amount),
                "type": t.type,
                "category": t.category,
                "date": t.transaction_date.isoformat(),
                "payment_method": t.payment_method,
                "notes": t.notes,
            }
            for t in txs
        ],
        "budgets": [
            {
                "category": b.category,
                "amount": float(b.amount),
                "month": b.month,
                "year": b.year,
            }
            for b in budgets
        ],
        "savings_goals": [
            {
                "name": g.name,
                "target_amount": float(g.target_amount),
                "current_amount": float(g.current_amount),
                "target_date": g.target_date.isoformat(),
                "description": g.description,
            }
            for g in goals
        ],
        "recurring_payments": [
            {
                "name": r.name,
                "amount": float(r.amount),
                "frequency": r.frequency,
                "next_payment_date": r.next_payment_date.isoformat(),
                "category": r.category,
                "status": r.status,
            }
            for r in recurring
        ],
    }

    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=paisawise_full_export_{current_user.id}.json"
        },
    )

