from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    currency: Optional[str] = "INR"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    currency: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., gt=0)
    type: str = Field(..., pattern="^(income|expense)$")
    category: str = Field(..., min_length=1, max_length=100)
    transaction_date: date
    payment_method: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    category: Optional[str] = None
    transaction_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Budget Schemas ---
class BudgetBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    amount: Decimal = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent: Decimal = Decimal("0.00")
    remaining: Decimal = Decimal("0.00")
    percentage: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# --- Savings Goal Schemas ---
class SavingsGoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    target_date: date
    description: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = Field(None, gt=0)
    current_amount: Optional[Decimal] = Field(None, ge=0)
    target_date: Optional[date] = None
    description: Optional[str] = None


class SavingsGoalContribution(BaseModel):
    amount: Decimal = Field(..., gt=0)


class SavingsGoalResponse(SavingsGoalBase):
    id: int
    user_id: int
    created_at: datetime
    progress_percentage: float = 0.0
    remaining_amount: Decimal = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)


# --- Recurring Payment Schemas ---
class RecurringPaymentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., gt=0)
    frequency: str = Field(..., pattern="^(monthly|weekly|quarterly|yearly)$")
    next_payment_date: date
    category: str = Field(..., min_length=1, max_length=100)
    status: str = Field(default="active", pattern="^(active|paused)$")


class RecurringPaymentCreate(RecurringPaymentBase):
    pass


class RecurringPaymentUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    frequency: Optional[str] = Field(None, pattern="^(monthly|weekly|quarterly|yearly)$")
    next_payment_date: Optional[date] = None
    category: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|paused)$")


class RecurringPaymentResponse(RecurringPaymentBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Overview & Insights Schemas ---
class FinancialSummary(BaseModel):
    total_balance: Decimal
    monthly_income: Decimal
    monthly_expenses: Decimal
    monthly_savings: Decimal
    savings_rate: float
    income_change_pct: Optional[float] = None
    expense_change_pct: Optional[float] = None


class SpendingTrendPoint(BaseModel):
    date: str
    income: Decimal
    expenses: Decimal


class CategorySpending(BaseModel):
    category: str
    amount: Decimal
    percentage: float
    transaction_count: int


class FinancialInsight(BaseModel):
    id: str
    text: str
    type: str  # "info", "positive", "warning"


# --- SMS Parser & Batch Import Schemas ---
class SMSParseRequest(BaseModel):
    text: str = Field(..., min_length=5)


class ParsedTransaction(BaseModel):
    name: str
    amount: Decimal
    type: str
    category: str
    transaction_date: date
    payment_method: str
    notes: Optional[str] = None
    confidence: float = 0.90
    raw_text: str


class BatchImportRequest(BaseModel):
    transactions: List[TransactionCreate]


class BatchImportResponse(BaseModel):
    imported_count: int
    transactions: List[TransactionResponse]

