from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, func
from typing import Optional, List
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models import Transaction, User
from app.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    SMSParseRequest,
    ParsedTransaction,
    BatchImportRequest,
    BatchImportResponse,
)
from app.sms_parser import parse_sms_batch
from app.auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: str = Query("date", pattern="^(date|amount)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Transaction.name.ilike(search_term)) | 
            (Transaction.notes.ilike(search_term)) |
            (Transaction.payment_method.ilike(search_term))
        )

    if category and category.lower() != "all":
        query = query.filter(Transaction.category == category)

    if type and type.lower() != "all":
        query = query.filter(Transaction.type == type)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)

    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    total_count = query.count()

    # Calculate totals for the current filter
    total_income = Decimal("0.00")
    total_expense = Decimal("0.00")
    all_filtered = query.all()
    for tx in all_filtered:
        if tx.type == "income":
            total_income += tx.amount
        else:
            total_expense += tx.amount

    # Sorting
    sort_column = Transaction.transaction_date if sort_by == "date" else Transaction.amount
    if order == "desc":
        query = query.order_by(desc(sort_column), desc(Transaction.id))
    else:
        query = query.order_by(asc(sort_column), asc(Transaction.id))

    # Pagination
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return {
        "items": [TransactionResponse.model_validate(item) for item in items],
        "total_count": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "net": total_income - total_expense,
        }
    }


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = Transaction(
        user_id=current_user.id,
        name=tx_in.name.strip(),
        amount=tx_in.amount,
        type=tx_in.type,
        category=tx_in.category.strip(),
        transaction_date=tx_in.transaction_date,
        payment_method=tx_in.payment_method.strip(),
        notes=tx_in.notes.strip() if tx_in.notes else None,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.get("/categories", response_model=List[str])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(Transaction.category)
        .filter(Transaction.user_id == current_user.id)
        .distinct()
        .all()
    )
    categories = [r[0] for r in results if r[0]]
    default_categories = [
        "Salary", "Freelance", "Investments", "Housing & Rent",
        "Groceries & Food", "Dining & Cafes", "Utilities & Internet",
        "Transportation", "Entertainment & Subs", "Health & Fitness",
        "Shopping", "Education", "Gifts & Donations", "Travel", "Other"
    ]
    # Union preserving order
    all_cats = list(dict.fromkeys(default_categories + categories))
    return all_cats


@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return tx


@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: int,
    tx_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    update_data = tx_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "name" and value is not None:
            value = value.strip()
        if field == "category" and value is not None:
            value = value.strip()
        if field == "payment_method" and value is not None:
            value = value.strip()
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted successfully."}


@router.post("/parse-sms", response_model=List[ParsedTransaction])
def parse_sms_endpoint(
    payload: SMSParseRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Parses single or multi-line Indian bank SMS alerts completely offline.
    Extracts Amount, Merchant, Category, Date, and Payment Method.
    """
    results = parse_sms_batch(payload.text)
    if not results:
        raise HTTPException(
            status_code=400,
            detail="Could not detect valid transaction details in the provided text. Please verify the SMS alert format."
        )
    return [ParsedTransaction(**r) for r in results]


@router.post("/batch-import", response_model=BatchImportResponse, status_code=status.HTTP_201_CREATED)
def batch_import_transactions(
    payload: BatchImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Batch inserts multiple parsed transactions in a single atomic database operation.
    """
    if not payload.transactions:
        raise HTTPException(status_code=400, detail="No transactions provided for batch import.")

    created = []
    for tx_in in payload.transactions:
        tx = Transaction(
            user_id=current_user.id,
            name=tx_in.name.strip(),
            amount=tx_in.amount,
            type=tx_in.type,
            category=tx_in.category.strip(),
            transaction_date=tx_in.transaction_date,
            payment_method=tx_in.payment_method.strip(),
            notes=tx_in.notes.strip() if tx_in.notes else None,
        )
        db.add(tx)
        created.append(tx)

    db.commit()
    for tx in created:
        db.refresh(tx)

    return BatchImportResponse(
        imported_count=len(created),
        transactions=[TransactionResponse.model_validate(tx) for tx in created]
    )

