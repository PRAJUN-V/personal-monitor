import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, get_db, User
from sqlalchemy.orm import sessionmaker
import auth

# Use a separate test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = sessionmaker(autocommit=False, autoflush=False, bind=engine)

client = TestClient(app)

def test_health_api_compatibility():
    # Test if the model can be instantiated and validated with a date
    # This specifically targets the TypeError that broke Render
    username = "testuser_health"
    password = "testpassword123"
    
    # 1. Register/Login to get token
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test POST /api/health with a date string
    payload = {
        "date": "2026-06-14",
        "height": 180.0,
        "weight": 80.0,
        "bp_systolic": 120,
        "bp_diastolic": 80
    }
    response = client.post("/api/health", json=payload, headers=headers)
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-06-14"
    assert data["bmi"] == 24.69
    assert data["category"] == "Normal weight"

def test_health_api_optional_date():
    # Test if the model works when date is omitted (default to today)
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
    assert data["weight_diff_to_normal"] > 0

def test_health_api_empty_bp_strings():
    # Test if the API correctly handles empty strings for BP fields
    username = "testuser_empty_bp"
    password = "testpassword123"
    
    client.post("/register", json={"username": username, "password": password})
    login_res = client.post("/token", data={"username": username, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "height": 175.0,
        "weight": 70.0,
        "bp_systolic": "", # Frontend might send empty string
        "bp_diastolic": ""
    }
    response = client.post("/api/health", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["bp_systolic"] is None
    assert data["bp_diastolic"] is None
