from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from typing import Optional, List, Dict, Any
from datetime import date, timedelta
from decimal import Decimal
import calendar
from app.database import get_db
from app.models import Transaction, Budget, User, SavingsGoal, RecurringPayment
from app.price_oracle import analyze_product_url
from app.schemas import (
    FinancialSummary,
    SpendingTrendPoint,
    CategorySpending,
    FinancialInsight,
    TransactionResponse,
    BudgetResponse,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def get_overview(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    sel_month = month or today.month
    sel_year = year or today.year

    # 1. Total Balance across all time
    all_income = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "income")
        .scalar()
        or Decimal("0.00")
    )
    all_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "expense")
        .scalar()
        or Decimal("0.00")
    )
    total_balance = Decimal(str(all_income)) - Decimal(str(all_expense))

    # 2. Selected Month figures
    m_income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income",
            extract("month", Transaction.transaction_date) == sel_month,
            extract("year", Transaction.transaction_date) == sel_year,
        )
        .scalar()
        or Decimal("0.00")
    )
    m_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            extract("month", Transaction.transaction_date) == sel_month,
            extract("year", Transaction.transaction_date) == sel_year,
        )
        .scalar()
        or Decimal("0.00")
    )

    monthly_income = Decimal(str(m_income))
    monthly_expenses = Decimal(str(m_expense))
    monthly_savings = monthly_income - monthly_expenses
    savings_rate = float((monthly_savings / monthly_income) * 100) if monthly_income > 0 else 0.0

    # 3. Previous Month figures for comparison
    prev_month = 12 if sel_month == 1 else sel_month - 1
    prev_year = sel_year - 1 if sel_month == 1 else sel_year

    pm_income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income",
            extract("month", Transaction.transaction_date) == prev_month,
            extract("year", Transaction.transaction_date) == prev_year,
        )
        .scalar()
        or Decimal("0.00")
    )
    pm_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            extract("month", Transaction.transaction_date) == prev_month,
            extract("year", Transaction.transaction_date) == prev_year,
        )
        .scalar()
        or Decimal("0.00")
    )
    prev_income = Decimal(str(pm_income))
    prev_expense = Decimal(str(pm_expense))

    income_change_pct = (
        round(float(((monthly_income - prev_income) / prev_income) * 100), 1)
        if prev_income > 0
        else None
    )
    expense_change_pct = (
        round(float(((monthly_expenses - prev_expense) / prev_expense) * 100), 1)
        if prev_expense > 0
        else None
    )

    # 4. Spending Trend Points (daily breakdown for the month)
    _, days_in_month = calendar.monthrange(sel_year, sel_month)
    month_txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            extract("month", Transaction.transaction_date) == sel_month,
            extract("year", Transaction.transaction_date) == sel_year,
        )
        .all()
    )

    daily_income_map = {day: Decimal("0.00") for day in range(1, days_in_month + 1)}
    daily_expense_map = {day: Decimal("0.00") for day in range(1, days_in_month + 1)}
    for tx in month_txs:
        day_num = tx.transaction_date.day
        if tx.type == "income":
            daily_income_map[day_num] += tx.amount
        else:
            daily_expense_map[day_num] += tx.amount

    trend_points = []
    # Group into weeks or days (daily up to current date or end of month)
    max_day = min(today.day, days_in_month) if (sel_year == today.year and sel_month == today.month) else days_in_month
    for d in range(1, max_day + 1):
        dt_str = f"{sel_year}-{sel_month:02d}-{d:02d}"
        trend_points.append(
            SpendingTrendPoint(
                date=dt_str,
                income=daily_income_map[d],
                expenses=daily_expense_map[d],
            )
        )

    # 5. Recent 5 transactions
    recent_txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.transaction_date), desc(Transaction.id))
        .limit(5)
        .all()
    )

    # 6. Budgets overview
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == sel_month,
            Budget.year == sel_year,
        )
        .all()
    )
    cat_spent_map = {}
    for tx in month_txs:
        if tx.type == "expense":
            cat_spent_map[tx.category] = cat_spent_map.get(tx.category, Decimal("0.00")) + tx.amount

    budget_overviews = []
    for b in budgets:
        sp = cat_spent_map.get(b.category, Decimal("0.00"))
        rem = b.amount - sp
        pct = float((sp / b.amount) * 100) if b.amount > 0 else 0.0
        budget_overviews.append(
            BudgetResponse(
                id=b.id,
                user_id=b.user_id,
                category=b.category,
                amount=b.amount,
                month=b.month,
                year=b.year,
                spent=sp,
                remaining=rem,
                percentage=round(pct, 1),
            )
        )

    # 7. Real calculated financial insights
    insights: List[FinancialInsight] = []

    # Category breakdown for insights
    if monthly_expenses > 0 and cat_spent_map:
        top_cat, top_cat_amt = max(cat_spent_map.items(), key=lambda x: x[1])
        cat_pct = round(float((top_cat_amt / monthly_expenses) * 100), 1)
        insights.append(
            FinancialInsight(
                id="top_category",
                text=f"{top_cat} accounts for {cat_pct}% of your monthly spending (₹{top_cat_amt:,.2f}).",
                type="info",
            )
        )

    # Week-over-week calculation
    last_7_days_start = today - timedelta(days=7)
    prev_7_days_start = today - timedelta(days=14)
    last_7_exp = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= last_7_days_start,
            Transaction.transaction_date <= today,
        )
        .scalar()
        or Decimal("0.00")
    )
    prev_7_exp = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= prev_7_days_start,
            Transaction.transaction_date < last_7_days_start,
        )
        .scalar()
        or Decimal("0.00")
    )
    l7 = Decimal(str(last_7_exp))
    p7 = Decimal(str(prev_7_exp))
    if p7 > 0:
        diff = l7 - p7
        if diff < 0:
            insights.append(
                FinancialInsight(
                    id="wow_saving",
                    text=f"You spent ₹{abs(diff):,.2f} less in the last 7 days compared to the prior week.",
                    type="positive",
                )
            )
        else:
            insights.append(
                FinancialInsight(
                    id="wow_increase",
                    text=f"Your spending increased by ₹{diff:,.2f} over the past 7 days.",
                    type="warning",
                )
            )

    # Savings rate insight
    if monthly_income > 0:
        if savings_rate >= 20.0:
            insights.append(
                FinancialInsight(
                    id="savings_rate_healthy",
                    text=f"Your savings rate is {savings_rate:.1f}% this month, exceeding the 20% financial wellness rule.",
                    type="positive",
                )
            )
        else:
            insights.append(
                FinancialInsight(
                    id="savings_rate_low",
                    text=f"Savings rate is currently {savings_rate:.1f}%. Trimming discretionary expenses could help reach 20%.",
                    type="warning",
                )
            )

    # Overbudget warning insight
    over_budget_items = [b for b in budget_overviews if b.percentage >= 100.0]
    if over_budget_items:
        names = ", ".join([b.category for b in over_budget_items[:2]])
        insights.append(
            FinancialInsight(
                id="budget_exceeded",
                text=f"Budget limit exceeded in {names}. Review recent transactions to rebalance.",
                type="warning",
            )
        )

    return {
        "summary": FinancialSummary(
            total_balance=total_balance,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
            monthly_savings=monthly_savings,
            savings_rate=round(savings_rate, 1),
            income_change_pct=income_change_pct,
            expense_change_pct=expense_change_pct,
        ),
        "trends": trend_points,
        "recent_transactions": [TransactionResponse.model_validate(t) for t in recent_txs],
        "budgets": budget_overviews,
        "insights": insights,
        "selected_period": {"month": sel_month, "year": sel_year},
    }


@router.get("/deep")
def get_deep_analytics(
    range: str = Query("month", pattern="^(month|quarter|year)$"),
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    sel_month = month or today.month
    sel_year = year or today.year

    if range == "month":
        start_date = date(sel_year, sel_month, 1)
        _, last_day = calendar.monthrange(sel_year, sel_month)
        end_date = date(sel_year, sel_month, last_day)
    elif range == "quarter":
        q_start_month = ((sel_month - 1) // 3) * 3 + 1
        start_date = date(sel_year, q_start_month, 1)
        q_end_month = q_start_month + 2
        _, last_day = calendar.monthrange(sel_year, q_end_month)
        end_date = date(sel_year, q_end_month, last_day)
    else:  # year
        start_date = date(sel_year, 1, 1)
        end_date = date(sel_year, 12, 31)

    txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
        .all()
    )

    total_income = Decimal("0.00")
    total_expense = Decimal("0.00")
    cat_spent_map: Dict[str, Decimal] = {}
    cat_count_map: Dict[str, int] = {}

    for tx in txs:
        if tx.type == "income":
            total_income += tx.amount
        else:
            total_expense += tx.amount
            cat_spent_map[tx.category] = cat_spent_map.get(tx.category, Decimal("0.00")) + tx.amount
            cat_count_map[tx.category] = cat_count_map.get(tx.category, 0) + 1

    # Category breakdown
    categories: List[CategorySpending] = []
    for cat, amt in sorted(cat_spent_map.items(), key=lambda x: x[1], reverse=True):
        pct = float((amt / total_expense) * 100) if total_expense > 0 else 0.0
        categories.append(
            CategorySpending(
                category=cat,
                amount=amt,
                percentage=round(pct, 1),
                transaction_count=cat_count_map.get(cat, 0),
            )
        )

    # Monthly breakdown for the year or past 6 months
    monthly_history = []
    for m in range(1, 13):
        m_inc = Decimal("0.00")
        m_exp = Decimal("0.00")
        for tx in txs:
            if tx.transaction_date.month == m:
                if tx.type == "income":
                    m_inc += tx.amount
                else:
                    m_exp += tx.amount
        monthly_history.append({
            "month": calendar.month_abbr[m],
            "income": m_inc,
            "expenses": m_exp,
            "savings": m_inc - m_exp,
        })

    # Average daily expenditure
    days_count = max(1, (min(end_date, today) - start_date).days + 1)
    avg_daily_expense = round(total_expense / Decimal(str(days_count)), 2)

    return {
        "range": range,
        "start_date": start_date,
        "end_date": end_date,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": total_income - total_expense,
        "savings_rate": round(float(((total_income - total_expense) / total_income) * 100), 1) if total_income > 0 else 0.0,
        "avg_daily_expense": avg_daily_expense,
        "category_spending": categories,
        "monthly_history": monthly_history,
    }


class AffordabilityRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    name: Optional[str] = "Planned Purchase"
    category: Optional[str] = "Shopping"


class AffordabilityResponse(BaseModel):
    verdict: str  # "SAFE" | "CAUTION" | "DANGER"
    verdict_title: str
    advice: str
    hours_of_work: float
    work_time_formatted: str
    hourly_rate: Decimal
    current_balance: Decimal
    upcoming_bills: Decimal
    discretionary_before: Decimal
    discretionary_after: Decimal
    daily_budget_before: Decimal
    daily_budget_after: Decimal
    days_remaining: int
    goal_impact: Optional[str] = None


@router.post("/can-i-afford", response_model=AffordabilityResponse)
def check_affordability(
    payload: AffordabilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    _, days_in_month = calendar.monthrange(today.year, today.month)
    days_remaining = max(1, days_in_month - today.day + 1)

    # 1. Total Cumulative Balance
    all_income = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "income")
        .scalar()
        or Decimal("0.00")
    )
    all_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "expense")
        .scalar()
        or Decimal("0.00")
    )
    current_balance = Decimal(str(all_income)) - Decimal(str(all_expense))

    # 2. Upcoming Active Recurring Bills for remainder of this month
    recurring_items = (
        db.query(RecurringPayment)
        .filter(
            RecurringPayment.user_id == current_user.id,
            RecurringPayment.status == "active",
        )
        .all()
    )
    upcoming_bills = Decimal("0.00")
    for r in recurring_items:
        # Check if next_payment_date falls in remainder of current month
        if r.next_payment_date >= today and r.next_payment_date.month == today.month and r.next_payment_date.year == today.year:
            upcoming_bills += r.amount

    # 3. Monthly Income & Hourly Rate calculation
    # Standard work hours: 160 hours / month (40 hrs/wk * 4)
    m_income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income",
            extract("month", Transaction.transaction_date) == today.month,
            extract("year", Transaction.transaction_date) == today.year,
        )
        .scalar()
        or Decimal("0.00")
    )
    monthly_income = Decimal(str(m_income))
    if monthly_income <= 0:
        # Fallback to last 60 days average or baseline 50,000 INR
        monthly_income = Decimal("60000.00")

    hourly_rate = round(monthly_income / Decimal("160.0"), 2)
    hours_of_work = float(round(payload.amount / hourly_rate, 1))

    # Format work time (e.g., "4.5 hrs" or "2 days 3 hrs")
    if hours_of_work < 8:
        work_time_formatted = f"{hours_of_work} hours of work"
    else:
        days_work = int(hours_of_work // 8)
        rem_hrs = round(hours_of_work % 8, 1)
        work_time_formatted = f"{days_work} working day{'s' if days_work > 1 else ''} and {rem_hrs} hrs"

    # 4. Discretionary Capital & Daily Budgeting
    discretionary_before = max(Decimal("0.00"), current_balance - upcoming_bills)
    discretionary_after = discretionary_before - payload.amount

    daily_before = round(discretionary_before / Decimal(str(days_remaining)), 2)
    daily_after = round(discretionary_after / Decimal(str(days_remaining)), 2) if discretionary_after > 0 else Decimal("0.00")

    # 5. Impact on Savings Goals
    active_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == current_user.id,
            SavingsGoal.current_amount < SavingsGoal.target_amount,
        )
        .order_by(SavingsGoal.target_date.asc())
        .all()
    )
    goal_impact = None
    if active_goals:
        top_goal = active_goals[0]
        rem_target = top_goal.target_amount - top_goal.current_amount
        pct_of_goal = round(float((payload.amount / rem_target) * 100), 1) if rem_target > 0 else 0
        if pct_of_goal >= 10:
            goal_impact = f"This purchase equals {pct_of_goal}% of the remaining target for your '{top_goal.name}' goal."

    # 6. Honest Verdict
    if discretionary_after < 0:
        shortfall = abs(discretionary_after)
        verdict = "DANGER"
        verdict_title = "Unsafe — Cuts into essential obligations"
        advice = (
            f"This purchase will cause a ₹{shortfall:,.2f} deficit against your upcoming scheduled bills "
            f"(such as rent and subscriptions totaling ₹{upcoming_bills:,.2f}). We recommend postponing this purchase."
        )
    elif daily_after < Decimal("250.00") or (daily_before > 0 and (daily_after / daily_before) < Decimal("0.4")):
        verdict = "CAUTION"
        verdict_title = "Tight — Compresses remaining daily budget"
        advice = (
            f"You can technically cover this, but it drops your safe daily allowance for the next "
            f"{days_remaining} days from ₹{daily_before:,.2f}/day to ₹{daily_after:,.2f}/day. Try waiting 48 hours to see if you still need it."
        )
    else:
        verdict = "SAFE"
        verdict_title = "Safe — Zero disruption to bills or savings"
        advice = (
            f"All upcoming obligations (₹{upcoming_bills:,.2f}) remain fully funded. "
            f"You will still have a healthy allowance of ₹{daily_after:,.2f}/day for the remaining {days_remaining} days of the month."
        )

    return AffordabilityResponse(
        verdict=verdict,
        verdict_title=verdict_title,
        advice=advice,
        hours_of_work=hours_of_work,
        work_time_formatted=work_time_formatted,
        hourly_rate=hourly_rate,
        current_balance=current_balance,
        upcoming_bills=upcoming_bills,
        discretionary_before=discretionary_before,
        discretionary_after=discretionary_after,
        daily_budget_before=daily_before,
        daily_budget_after=daily_after,
        days_remaining=days_remaining,
        goal_impact=goal_impact,
    )


class PriceCheckRequest(BaseModel):
    url: str = Field(..., min_length=3)
    custom_name: Optional[str] = None
    override_price: Optional[Decimal] = None


class PriceHistoryPoint(BaseModel):
    date: str
    price: float
    note: Optional[str] = None


class PriceCheckResponse(BaseModel):
    platform: str
    product_name: str
    current_price: Decimal
    all_time_low: Decimal
    all_time_high: Decimal
    average_price: Decimal
    discount_from_high: float
    history_points: List[PriceHistoryPoint]
    timing_verdict: str  # "BUY_NOW" | "WAIT" | "FAIR"
    timing_title: str
    timing_advice: str
    # Personal finance integration
    affordability_verdict: str  # "SAFE" | "CAUTION" | "DANGER"
    affordability_advice: str
    hours_of_work: float
    work_time_formatted: str
    hourly_rate: Decimal
    current_balance: Decimal
    upcoming_bills: Decimal
    daily_budget_after: Decimal
    days_remaining: int


@router.post("/price-check", response_model=PriceCheckResponse)
def check_product_price_and_timing(
    payload: PriceCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Price history & timing analysis via Price Oracle
    product_data = analyze_product_url(
        payload.url,
        custom_name=payload.custom_name,
        override_price=payload.override_price,
    )

    # 2. Personal finance affordability evaluation
    today = date.today()
    _, days_in_month = calendar.monthrange(today.year, today.month)
    days_remaining = max(1, days_in_month - today.day + 1)

    all_income = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "income")
        .scalar()
        or Decimal("0.00")
    )
    all_expense = (
        db.query(func.sum(Transaction.amount))
        .filter(Transaction.user_id == current_user.id, Transaction.type == "expense")
        .scalar()
        or Decimal("0.00")
    )
    current_balance = Decimal(str(all_income)) - Decimal(str(all_expense))

    recurring_items = (
        db.query(RecurringPayment)
        .filter(
            RecurringPayment.user_id == current_user.id,
            RecurringPayment.status == "active",
        )
        .all()
    )
    upcoming_bills = Decimal("0.00")
    for r in recurring_items:
        if r.next_payment_date >= today and r.next_payment_date.month == today.month and r.next_payment_date.year == today.year:
            upcoming_bills += r.amount

    m_income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "income",
            extract("month", Transaction.transaction_date) == today.month,
            extract("year", Transaction.transaction_date) == today.year,
        )
        .scalar()
        or Decimal("0.00")
    )
    monthly_income = Decimal(str(m_income)) if m_income > 0 else Decimal("60000.00")
    hourly_rate = round(monthly_income / Decimal("160.0"), 2)
    hours_of_work = float(round(product_data["current_price"] / hourly_rate, 1))

    if hours_of_work < 8:
        work_time_formatted = f"{hours_of_work} hours of work"
    else:
        days_work = int(hours_of_work // 8)
        rem_hrs = round(hours_of_work % 8, 1)
        work_time_formatted = f"{days_work} working day{'s' if days_work > 1 else ''} and {rem_hrs} hrs"

    discretionary_before = max(Decimal("0.00"), current_balance - upcoming_bills)
    discretionary_after = discretionary_before - product_data["current_price"]
    daily_after = round(discretionary_after / Decimal(str(days_remaining)), 2) if discretionary_after > 0 else Decimal("0.00")

    if discretionary_after < 0:
        affordability_verdict = "DANGER"
        affordability_advice = (
            f"Caution: Purchasing this now leaves a deficit against your upcoming ₹{upcoming_bills:,.2f} scheduled bills."
        )
    elif daily_after < Decimal("250.00"):
        affordability_verdict = "CAUTION"
        affordability_advice = (
            f"You have funds, but purchasing drops your safe daily allowance to ₹{daily_after:,.2f}/day for {days_remaining} days."
        )
    else:
        affordability_verdict = "SAFE"
        affordability_advice = (
            f"Fully covered by discretionary funds. Leaves ₹{daily_after:,.2f}/day allowance while keeping bills protected."
        )

    return PriceCheckResponse(
        platform=product_data["platform"],
        product_name=product_data["product_name"],
        current_price=product_data["current_price"],
        all_time_low=product_data["all_time_low"],
        all_time_high=product_data["all_time_high"],
        average_price=product_data["average_price"],
        discount_from_high=product_data["discount_from_high"],
        history_points=[PriceHistoryPoint(**p) for p in product_data["history_points"]],
        timing_verdict=product_data["timing_verdict"],
        timing_title=product_data["timing_title"],
        timing_advice=product_data["timing_advice"],
        affordability_verdict=affordability_verdict,
        affordability_advice=affordability_advice,
        hours_of_work=hours_of_work,
        work_time_formatted=work_time_formatted,
        hourly_rate=hourly_rate,
        current_balance=current_balance,
        upcoming_bills=upcoming_bills,
        daily_budget_after=daily_after,
        days_remaining=days_remaining,
    )
