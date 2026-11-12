from datetime import datetime, timezone, date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    recurring_payments = relationship("RecurringPayment", back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(200), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(String(20), nullable=False)  # "income" or "expense"
    category = Column(String(100), nullable=False, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="transactions")

    __table_args__ = (
        Index("idx_user_tx_date", "user_id", "transaction_date"),
        Index("idx_user_type_date", "user_id", "type", "transaction_date"),
    )


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)

    user = relationship("User", back_populates="budgets")

    __table_args__ = (
        Index("idx_user_budget_period", "user_id", "year", "month"),
    )


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(200), nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    target_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="savings_goals")


class RecurringPayment(Base):
    __tablename__ = "recurring_payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(200), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    frequency = Column(String(50), nullable=False)  # "monthly", "weekly", "quarterly", "yearly"
    next_payment_date = Column(Date, nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(20), default="active", nullable=False)  # "active", "paused"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="recurring_payments")
