from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import User, Transaction, Budget, SavingsGoal, RecurringPayment


def seed_demo_data(user: User, db: Session):
    # Clear any existing data for clean demo
    db.query(Transaction).filter(Transaction.user_id == user.id).delete()
    db.query(Budget).filter(Budget.user_id == user.id).delete()
    db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).delete()
    db.query(RecurringPayment).filter(RecurringPayment.user_id == user.id).delete()
    db.commit()

    today = date.today()
    current_year = today.year
    current_month = today.month

    # 1. Budgets for current month
    budgets_data = [
        ("Housing & Rent", Decimal("22000.00")),
        ("Groceries & Food", Decimal("12000.00")),
        ("Dining & Cafes", Decimal("6000.00")),
        ("Utilities & Internet", Decimal("4500.00")),
        ("Transportation", Decimal("5000.00")),
        ("Entertainment & Subs", Decimal("3000.00")),
        ("Health & Fitness", Decimal("3500.00")),
        ("Shopping", Decimal("7000.00")),
    ]
    for cat, amt in budgets_data:
        b = Budget(
            user_id=user.id,
            category=cat,
            amount=amt,
            month=current_month,
            year=current_year,
        )
        db.add(b)

    # 2. Savings Goals
    savings_data = [
        ("Emergency Fund (6 Months)", Decimal("200000.00"), Decimal("145000.00"), today + timedelta(days=120), "6 months of living expenses safely deposited"),
        ("New MacBook Pro M4", Decimal("169900.00"), Decimal("110000.00"), today + timedelta(days=60), "Work workstation upgrade"),
        ("Himachal Vacation", Decimal("45000.00"), Decimal("32000.00"), today + timedelta(days=45), "Trek and cabin retreat"),
        ("Annual Tech Conference Pass", Decimal("25000.00"), Decimal("15000.00"), today + timedelta(days=90), "Design & engineering summit in Bengaluru"),
    ]
    for name, target, current, target_dt, desc in savings_data:
        g = SavingsGoal(
            user_id=user.id,
            name=name,
            target_amount=target,
            current_amount=current,
            target_date=target_dt,
            description=desc,
        )
        db.add(g)

    # 3. Recurring Payments
    recurring_data = [
        ("Apartment Rent", Decimal("22000.00"), "monthly", date(current_year, current_month, 1), "Housing & Rent", "active"),
        ("High-Speed Fiber Broadband", Decimal("1179.00"), "monthly", date(current_year, current_month, 5), "Utilities & Internet", "active"),
        ("Electricity Bill", Decimal("1850.00"), "monthly", date(current_year, current_month, 10), "Utilities & Internet", "active"),
        ("Mutual Fund SIP (Nifty 50)", Decimal("15000.00"), "monthly", date(current_year, current_month, 7), "Investments", "active"),
        ("Cult.fit Gym Membership", Decimal("1800.00"), "monthly", date(current_year, current_month, 15), "Health & Fitness", "active"),
        ("Spotify Premium", Decimal("119.00"), "monthly", date(current_year, current_month, 18), "Entertainment & Subs", "active"),
        ("Netflix 4K UHD", Decimal("649.00"), "monthly", date(current_year, current_month, 22), "Entertainment & Subs", "active"),
        ("Cloud Storage & Domain", Decimal("2400.00"), "quarterly", date(current_year, current_month, 28), "Utilities & Internet", "active"),
    ]
    for name, amt, freq, next_dt, cat, status in recurring_data:
        r = RecurringPayment(
            user_id=user.id,
            name=name,
            amount=amt,
            frequency=freq,
            next_payment_date=next_dt,
            category=cat,
            status=status,
        )
        db.add(r)

    # 4. Realistic transactions across past 60 days
    # Prior month salary and expenses
    prev_month_date = today.replace(day=1) - timedelta(days=1)
    
    tx_list = [
        # Past month income
        ("Primary Salary - Tech Corp", Decimal("95000.00"), "income", "Salary", prev_month_date.replace(day=1), "Direct Bank Deposit", "Monthly tech lead compensation"),
        ("UI/UX Consulting Freelance", Decimal("28000.00"), "income", "Freelance", prev_month_date.replace(day=12), "Bank Transfer", "Design sprint retainer"),
        # Past month major expenses
        ("Apartment Rent", Decimal("22000.00"), "expense", "Housing & Rent", prev_month_date.replace(day=1), "Bank Transfer", "Monthly rent"),
        ("Nature's Basket Organic Groceries", Decimal("4800.00"), "expense", "Groceries & Food", prev_month_date.replace(day=3), "UPI", "Weekly grocery restock"),
        ("Blinkit Quick Delivery", Decimal("1120.00"), "expense", "Groceries & Food", prev_month_date.replace(day=8), "UPI", "Household supplies"),
        ("Third Wave Coffee", Decimal("480.00"), "expense", "Dining & Cafes", prev_month_date.replace(day=9), "UPI", "Client coffee meeting"),
        ("Uber Premier", Decimal("650.00"), "expense", "Transportation", prev_month_date.replace(day=14), "Credit Card", "Airport commute"),
        ("Uniqlo Linen Shirt & Chinos", Decimal("5990.00"), "expense", "Shopping", prev_month_date.replace(day=18), "Credit Card", "Office wardrobe"),
        ("Blue Tokai Coffee Beans", Decimal("890.00"), "expense", "Dining & Cafes", prev_month_date.replace(day=22), "UPI", "Aeropress roast"),

        # Current month income
        ("Primary Salary - Tech Corp", Decimal("95000.00"), "income", "Salary", today.replace(day=1), "Direct Bank Deposit", "Monthly direct payroll"),
        ("Product Design Mentorship", Decimal("18500.00"), "income", "Freelance", today.replace(day=6) if today.day >= 6 else today, "UPI", "Mentorship cohort payout"),
        
        # Current month expenses
        ("Apartment Rent", Decimal("22000.00"), "expense", "Housing & Rent", today.replace(day=1), "Bank Transfer", "NEFT rent payment"),
        ("Zepto Fresh Provisions", Decimal("2450.00"), "expense", "Groceries & Food", today.replace(day=2) if today.day >= 2 else today, "UPI", "Vegetables, dairy, staples"),
        ("Subko Specialty Coffee & Bakehouse", Decimal("720.00"), "expense", "Dining & Cafes", today.replace(day=3) if today.day >= 3 else today, "UPI", "Weekend espresso & croissant"),
        ("Fiber Broadband Internet", Decimal("1179.00"), "expense", "Utilities & Internet", today.replace(day=4) if today.day >= 4 else today, "UPI", "Airtel Xstream Fiber"),
        ("Indian Oil Fuel Refill", Decimal("3200.00"), "expense", "Transportation", today.replace(day=5) if today.day >= 5 else today, "Debit Card", "Full tank petrol"),
        ("Swiggy Gourmet Dinner", Decimal("1150.00"), "expense", "Dining & Cafes", today.replace(day=7) if today.day >= 7 else today, "UPI", "Thai curry & jasmine rice"),
        ("Cult.fit Pro Gym", Decimal("1800.00"), "expense", "Health & Fitness", today.replace(day=8) if today.day >= 8 else today, "UPI", "Monthly membership"),
        ("Amazon Books & Desk Mat", Decimal("2499.00"), "expense", "Shopping", today.replace(day=9) if today.day >= 9 else today, "Credit Card", "Ergonomic workspace accessories"),
        ("Nature's Basket Pantry Restock", Decimal("3850.00"), "expense", "Groceries & Food", today.replace(day=10) if today.day >= 10 else today, "UPI", "Cold pressed oils, grains"),
        ("Blue Tokai Pour Over", Decimal("380.00"), "expense", "Dining & Cafes", today, "UPI", "Afternoon brew"),
    ]

    for name, amt, tx_type, cat, dt, method, notes in tx_list:
        tx = Transaction(
            user_id=user.id,
            name=name,
            amount=amt,
            type=tx_type,
            category=cat,
            transaction_date=dt,
            payment_method=method,
            notes=notes,
        )
        db.add(tx)

    db.commit()

