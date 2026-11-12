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

    # CSV Export
    csv_res = client.get("/api/settings/export/csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Salary" in csv_res.text

    # JSON Export
    json_res = client.get("/api/settings/export/summary-json", headers=headers)
    assert json_res.status_code == 200
    assert json_res.json()["transactions_count"] > 0
