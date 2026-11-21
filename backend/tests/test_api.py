import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import User

# In-memory test database with StaticPool so all connections share the memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_auth_and_isolation():
    # Register User A
    res_a = client.post("/api/auth/register", json={
        "name": "User Alpha",
        "email": "alpha@example.com",
        "password": "Password123!",
        "currency": "INR"
    })
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    res_b = client.post("/api/auth/register", json={
        "name": "User Beta",
        "email": "beta@example.com",
        "password": "Password123!",
        "currency": "INR"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a transaction
    tx_res = client.post("/api/transactions", json={
        "name": "Salary Alpha",
        "amount": "80000.00",
        "type": "income",
        "category": "Salary",
        "transaction_date": "2026-11-01",
        "payment_method": "Bank Transfer",
        "notes": "Alpha salary"
    }, headers=headers_a)
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    # User B should NOT see User A's transaction
    list_b = client.get("/api/transactions", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()["items"]) == 0

    # User B cannot access User A's transaction directly
    get_b = client.get(f"/api/transactions/{tx_id}", headers=headers_b)
    assert get_b.status_code == 404

    # User B cannot delete User A's transaction
    del_b = client.delete(f"/api/transactions/{tx_id}", headers=headers_b)
    assert del_b.status_code == 404


def test_transaction_crud_and_calculations():
    # Login demo
    res = client.post("/api/auth/demo")
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check transactions list
    tx_list = client.get("/api/transactions", headers=headers)
    assert tx_list.status_code == 200
    assert len(tx_list.json()["items"]) > 0

    # Add expense
    new_tx = client.post("/api/transactions", json={
        "name": "Espresso Shot",
        "amount": "220.00",
        "type": "expense",
        "category": "Dining & Cafes",
        "transaction_date": "2026-11-10",
        "payment_method": "UPI",
        "notes": "Single origin roast"
    }, headers=headers)
    assert new_tx.status_code == 201
    new_id = new_tx.json()["id"]
    assert new_tx.json()["name"] == "Espresso Shot"

    # Edit expense
    edit_res = client.put(f"/api/transactions/{new_id}", json={
        "amount": "250.00",
        "notes": "Double shot roast"
    }, headers=headers)
    assert edit_res.status_code == 200
    assert float(edit_res.json()["amount"]) == 250.0

    # Delete expense
    del_res = client.delete(f"/api/transactions/{new_id}", headers=headers)
    assert del_res.status_code == 200


def test_budgets_and_savings():
    res = client.post("/api/auth/demo")
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Budgets list
    b_res = client.get("/api/budgets?month=11&year=2026", headers=headers)
    assert b_res.status_code == 200
    budgets = b_res.json()
    assert len(budgets) > 0
    assert "spent" in budgets[0]
    assert "remaining" in budgets[0]

    # Savings goals list
    s_res = client.get("/api/savings", headers=headers)
    assert s_res.status_code == 200
    goals = s_res.json()
    assert len(goals) > 0
    goal_id = goals[0]["id"]

    # Contribute to goal
    c_res = client.post(f"/api/savings/{goal_id}/contribute", json={"amount": "5000.00"}, headers=headers)
    assert c_res.status_code == 200
    assert float(c_res.json()["current_amount"]) >= 5000.0


def test_analytics_and_export():
    res = client.post("/api/auth/demo")
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    ov_res = client.get("/api/analytics/overview?month=11&year=2026", headers=headers)
    assert ov_res.status_code == 200
    ov = ov_res.json()
    assert "summary" in ov
    assert "total_balance" in ov["summary"]
    assert len(ov["insights"]) > 0

    # Deep Analytics test for all range filters
    for r_filter in ["month", "quarter", "year"]:
        deep_res = client.get(f"/api/analytics/deep?range={r_filter}", headers=headers)
        assert deep_res.status_code == 200
        d_json = deep_res.json()
        assert d_json["range"] == r_filter
        assert "monthly_history" in d_json
        assert len(d_json["monthly_history"]) == 12

    # CSV Export
    csv_res = client.get("/api/settings/export/csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Salary" in csv_res.text

    # JSON Export
    json_res = client.get("/api/settings/export/summary-json", headers=headers)
    assert json_res.status_code == 200
    assert json_res.json()["transactions_count"] > 0

    # Affordability check test
    afford_res = client.post("/api/analytics/can-i-afford", json={
        "amount": "1200.00",
        "name": "Noise Cancelling Headphones",
        "category": "Shopping"
    }, headers=headers)
    assert afford_res.status_code == 200
    data = afford_res.json()
    assert "verdict" in data
    assert data["hours_of_work"] > 0
    assert "work_time_formatted" in data
    assert "discretionary_before" in data

    # Test extreme amount triggers DANGER
    extreme_res = client.post("/api/analytics/can-i-afford", json={
        "amount": "9999999.00",
        "name": "Luxury Sports Car",
        "category": "Vehicles"
    }, headers=headers)
    assert extreme_res.status_code == 200
    assert extreme_res.json()["verdict"] == "DANGER"

    # Test Price Check Oracle - Amazon
    price_res = client.post("/api/analytics/price-check", json={
        "url": "https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH"
    }, headers=headers)
    assert price_res.status_code == 200
    pdata = price_res.json()
    assert pdata["platform"] == "Amazon"
    assert "Sony" in pdata["product_name"]
    assert len(pdata["history_points"]) > 0
    assert float(pdata["all_time_low"]) > 0
    assert "timing_verdict" in pdata
    assert "affordability_verdict" in pdata

    # Test Price Check Oracle - Flipkart (Hero Passion Bike accurate price)
    fk_res = client.post("/api/analytics/price-check", json={
        "url": "https://www.flipkart.com/hero-new-passion-booking-ex-showroom-price/p/itm88a44bac3e13c"
    }, headers=headers)
    assert fk_res.status_code == 200
    fk_data = fk_res.json()
    assert fk_data["platform"] == "Flipkart"
    assert "Hero" in fk_data["product_name"]
    # Verify the bike price is in the accurate ~81k range, NOT 10k!
    assert float(fk_data["current_price"]) >= 75000.00
    assert float(fk_data["current_price"]) <= 90000.00

    # Test Price Check Oracle - Unsupported platform returns 400
    bad_res = client.post("/api/analytics/price-check", json={
        "url": "https://www.myntra.com/casual-shoes/nike/nike-men-white-air-force-1-07-sneakers/13812836/buy"
    }, headers=headers)
    assert bad_res.status_code == 400
    assert "Amazon" in bad_res.json()["detail"]
    assert "Flipkart" in bad_res.json()["detail"]


def test_sms_parser_and_batch_import():
    res = client.post("/api/auth/demo")
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    sms_batch_text = """
    Rs 450.00 debited from a/c **1234 on 12-Nov-26 to VPA swiggy@icici (UPI Ref 431289123).
    Your A/C 1234 is credited with INR 85,000.00 on 01-Nov-26 by Salary (Ref 998811).
    Alert: You have spent INR 1,299.00 on HDFC Bank Credit Card ending 8812 at AMAZON INDIA on 10-NOV-2026.
    INR 350.00 spent on Axis Bank card at UBER INDIA on 13-Nov-26.
    """

    # 1. Test Parse SMS
    parse_res = client.post(
        "/api/transactions/parse-sms",
        json={"text": sms_batch_text},
        headers=headers,
    )
    assert parse_res.status_code == 200
    parsed_items = parse_res.json()
    assert len(parsed_items) == 4

    # Verify Swiggy parsed correctly
    swiggy = next(item for item in parsed_items if "Swiggy" in item["name"])
    assert float(swiggy["amount"]) == 450.00
    assert swiggy["type"] == "expense"
    assert swiggy["category"] == "Dining & Cafes"
    assert swiggy["payment_method"] == "UPI"

    # Verify Salary parsed correctly
    salary = next(item for item in parsed_items if item["type"] == "income")
    assert float(salary["amount"]) == 85000.00
    assert salary["category"] == "Salary"

    # Verify Amazon parsed correctly
    amazon = next(item for item in parsed_items if "Amazon" in item["name"])
    assert float(amazon["amount"]) == 1299.00
    assert amazon["category"] == "Shopping"
    assert amazon["payment_method"] == "Credit Card"

    # Verify Uber parsed correctly
    uber = next(item for item in parsed_items if "Uber" in item["name"])
    assert float(uber["amount"]) == 350.00
    assert uber["category"] == "Transportation"

    # 2. Test Batch Import
    to_import = [
        {
            "name": p["name"],
            "amount": p["amount"],
            "type": p["type"],
            "category": p["category"],
            "transaction_date": p["transaction_date"],
            "payment_method": p["payment_method"],
            "notes": p.get("notes"),
        }
        for p in parsed_items
    ]

    import_res = client.post(
        "/api/transactions/batch-import",
        json={"transactions": to_import},
        headers=headers,
    )
    assert import_res.status_code == 201
    import_data = import_res.json()
    assert import_data["imported_count"] == 4
    assert len(import_data["transactions"]) == 4

    # 3. Verify they show up in transaction list
    tx_res = client.get("/api/transactions?search=Swiggy", headers=headers)
    assert tx_res.status_code == 200
    assert len(tx_res.json()["items"]) >= 1

