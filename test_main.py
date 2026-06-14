import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from database import Base, get_db

# Use a separate test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the tables in the test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_health_api_compatibility():
    username = "testuser_health"
    password = "testpassword123"
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "date": "2026-06-14",
        "height": 180.0,
        "weight": 80.0,
        "bp_systolic": 120,
        "bp_diastolic": 80
    }
    response = client.post("/api/health", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-06-14"
    assert data["bmi"] == 24.69
    assert data["category"] == "Normal weight"

def test_health_api_optional_date():
    username = "testuser_health_opt"
    password = "testpassword123"
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "height": 170.0,
        "weight": 90.0,
        "bp_systolic": 130,
        "bp_diastolic": 85
    }
    response = client.post("/api/health", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Obese"

def test_health_api_empty_bp_strings():
    username = "testuser_empty_bp"
    password = "testpassword123"
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "height": 175.0,
        "weight": 70.0,
        "bp_systolic": "",
        "bp_diastolic": ""
    }
    response = client.post("/api/health", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["bp_systolic"] is None
    assert data["bp_diastolic"] is None

def test_health_api_edit_delete():
    username = "testuser_crud"
    password = "testpassword123"
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    create_res = client.post("/api/health", json={
        "height": 180, "weight": 80, "bp_systolic": 120, "bp_diastolic": 80
    }, headers=headers)
    record_id = create_res.json()["id"]
    
    update_res = client.put(f"/api/health/{record_id}", json={
        "height": 180, "weight": 75, "bp_systolic": 110, "bp_diastolic": 70
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["weight"] == 75
    
    delete_res = client.delete(f"/api/health/{record_id}", headers=headers)
    assert delete_res.status_code == 200

def test_finance_api():
    username = "finance_user"
    password = "password123"
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Source
    source_res = client.post("/api/sources", json={"name": "SBI", "balance": 1000}, headers=headers)
    assert source_res.status_code == 200
    source_id = source_res.json()["id"]

    # 2. Add Expense
    trans_res = client.post("/api/transactions", json={
        "source_id": source_id, "amount": 200, "type": "expense", "category": "Lunch"
    }, headers=headers)
    assert trans_res.status_code == 200

    # 3. Verify Balance Updated
    sources_res = client.get("/api/sources", headers=headers)
    sbi = next(s for s in sources_res.json() if s["id"] == source_id)
    assert sbi["balance"] == 800

    # 4. Add Income
    client.post("/api/transactions", json={
        "source_id": source_id, "amount": 500, "type": "income", "category": "Refund"
    }, headers=headers)
    
    # 5. Verify Balance Updated Again
    sources_res = client.get("/api/sources", headers=headers)
    sbi = next(s for s in sources_res.json() if s["id"] == source_id)
    assert sbi["balance"] == 1300
