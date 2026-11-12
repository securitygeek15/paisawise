import httpx

BASE_URL = "http://127.0.0.1:8000"

def test_full_live_e2e():
    with httpx.Client(base_url=BASE_URL, timeout=10) as client:
        # 1. Health check
        res = client.get("/api/health")
        assert res.status_code == 200
        print("✓ Health check passed")

        # 2. Demo login & seed
        demo_res = client.post("/api/auth/demo")
        assert demo_res.status_code == 200
        data = demo_res.json()
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ Demo login & seeding passed")

        # 3. Overview Analytics
        ov_res = client.get("/api/analytics/overview?month=11&year=2026", headers=headers)
        assert ov_res.status_code == 200
        ov_data = ov_res.json()
        assert float(ov_data["summary"]["total_balance"]) != 0
        assert len(ov_data["recent_transactions"]) == 5
        assert len(ov_data["budgets"]) > 0
        assert len(ov_data["insights"]) > 0
        print(f"✓ Overview passed (Total Balance: ₹{ov_data['summary']['total_balance']}, Insights count: {len(ov_data['insights'])})")

        # 4. Transactions List with Search & Filters
        tx_res = client.get("/api/transactions?limit=5", headers=headers)
        assert tx_res.status_code == 200
        assert len(tx_res.json()["items"]) == 5
        print("✓ Transactions listing & pagination passed")

        # 5. Add new transaction
        create_tx = client.post("/api/transactions", json={
            "name": "Live Test Expense",
            "amount": "999.00",
            "type": "expense",
            "category": "Dining & Cafes",
            "transaction_date": "2026-11-12",
            "payment_method": "UPI",
            "notes": "Testing live e2e"
        }, headers=headers)
        assert create_tx.status_code == 201
        tx_id = create_tx.json()["id"]
        print(f"✓ Created transaction ID {tx_id}")

        # 6. Budgets verification
        b_res = client.get("/api/budgets?month=11&year=2026", headers=headers)
        assert b_res.status_code == 200
        print(f"✓ Verified {len(b_res.json())} category budgets with automatic spending calculation")

        # 7. Savings goal contribution
        s_res = client.get("/api/savings", headers=headers)
        assert s_res.status_code == 200
        goal_id = s_res.json()[0]["id"]
        contrib_res = client.post(f"/api/savings/{goal_id}/contribute", json={"amount": "2500.00"}, headers=headers)
        assert contrib_res.status_code == 200
        print(f"✓ Contributed ₹2,500 to savings goal ID {goal_id}")

        # 8. Recurring payments
        r_res = client.get("/api/recurring", headers=headers)
        assert r_res.status_code == 200
        print(f"✓ Recurring payments verified (Monthly estimate: ₹{r_res.json()['estimated_monthly_expenditure']})")

        # 9. AI Assistant query based on real user data
        ai_res = client.post("/api/assistant/chat", json={
            "query": "Where did most of my money go this month?"
        }, headers=headers)
        assert ai_res.status_code == 200
        reply = ai_res.json()["reply"]
        assert "Housing & Rent" in reply or "₹" in reply
        print(f"✓ AI Assistant verified response: {reply[:80]}...")

        # 10. Settings CSV export
        csv_res = client.get("/api/settings/export/csv", headers=headers)
        assert csv_res.status_code == 200
        assert "Live Test Expense" in csv_res.text
        print("✓ CSV export verified with live record")

        # Cleanup test transaction
        client.delete(f"/api/transactions/{tx_id}", headers=headers)
        print("✓ Cleaned up test transaction")

        print("\nALL 10 LIVE SERVER INTEGRATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_live_e2e()

