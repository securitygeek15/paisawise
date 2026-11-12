from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models import RecurringPayment, User
from app.schemas import (
    RecurringPaymentCreate,
    RecurringPaymentUpdate,
    RecurringPaymentResponse,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/recurring", tags=["recurring"])


@router.get("")
def get_recurring_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(RecurringPayment)
        .filter(RecurringPayment.user_id == current_user.id)
        .order_by(RecurringPayment.next_payment_date.asc())
        .all()
    )

    # Calculate estimated recurring monthly expenditure
    monthly_estimate = Decimal("0.00")
    for p in payments:
        if p.status == "active":
            if p.frequency == "monthly":
                monthly_estimate += p.amount
            elif p.frequency == "weekly":
                monthly_estimate += p.amount * Decimal("4.333")
            elif p.frequency == "quarterly":
                monthly_estimate += p.amount / Decimal("3.0")
            elif p.frequency == "yearly":
                monthly_estimate += p.amount / Decimal("12.0")

    return {
        "items": [RecurringPaymentResponse.model_validate(p) for p in payments],
        "estimated_monthly_expenditure": round(monthly_estimate, 2),
        "active_count": len([p for p in payments if p.status == "active"]),
        "total_count": len(payments),
    }


@router.post("", response_model=RecurringPaymentResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_payment(
    item_in: RecurringPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = RecurringPayment(
        user_id=current_user.id,
        name=item_in.name.strip(),
        amount=item_in.amount,
        frequency=item_in.frequency,
        next_payment_date=item_in.next_payment_date,
        category=item_in.category.strip(),
        status=item_in.status,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=RecurringPaymentResponse)
def update_recurring_payment(
    item_id: int,
    item_in: RecurringPaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(RecurringPayment).filter(
        RecurringPayment.id == item_id,
        RecurringPayment.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring payment not found.")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field in ["name", "category"] and val is not None:
            val = val.strip()
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_recurring_payment(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(RecurringPayment).filter(
        RecurringPayment.id == item_id,
        RecurringPayment.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurring payment not found.")

    db.delete(item)
    db.commit()
    return {"message": "Recurring payment removed successfully."}
