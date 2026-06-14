from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
from typing import List, Optional, Union
import database
import auth
from pydantic import BaseModel, field_validator, ConfigDict

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# Pydantic models for API
class UserCreate(BaseModel):
    username: str
    password: str

class HealthRecordCreate(BaseModel):
    date: Optional[str] = None
    height: float
    weight: float
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):
        if not v:
            return None
        return str(v)

    @field_validator("bp_systolic", "bp_diastolic", mode="before")
    @classmethod
    def empty_string_to_null(cls, v):
        if v == "":
            return None
        return v

class HealthRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    height: float
    weight: float
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    bmi: float
    category: str
    weight_diff_to_normal: float

def calculate_health_metrics(height_cm: float, weight_kg: float):
    height_m = height_cm / 100
    bmi = round(weight_kg / (height_m ** 2), 2)
    
    if bmi < 18.5:
        category = "Underweight"
        target_weight = 18.5 * (height_m ** 2)
        diff = round(target_weight - weight_kg, 2)
    elif bmi <= 24.9:
        category = "Normal weight"
        diff = 0
    elif bmi <= 29.9:
        category = "Overweight"
        target_weight = 24.9 * (height_m ** 2)
        diff = round(weight_kg - target_weight, 2)
    else:
        category = "Obese"
        target_weight = 24.9 * (height_m ** 2)
        diff = round(weight_kg - target_weight, 2)
        
    return bmi, category, diff

# Health Endpoints
@app.post("/api/health", response_model=HealthRecordResponse)
async def create_health_record(
    record: HealthRecordCreate, 
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    # Convert string date to date object for SQLAlchemy
    record_data = record.dict()
    if record_data["date"] and isinstance(record_data["date"], str):
        record_data["date"] = datetime.strptime(record_data["date"], "%Y-%m-%d").date()
    elif not record_data["date"]:
        record_data["date"] = date.today()

    new_record = database.HealthRecord(
        **record_data,
        user_id=current_user.id
    )
        
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    bmi, category, diff = calculate_health_metrics(new_record.height, new_record.weight)
    
    return {
        **new_record.__dict__,
        "bmi": bmi,
        "category": category,
        "weight_diff_to_normal": diff
    }

@app.get("/api/health", response_model=List[HealthRecordResponse])
async def list_health_records(
    skip: int = 0, 
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    records = db.query(database.HealthRecord).filter(
        database.HealthRecord.user_id == current_user.id
    ).order_by(database.HealthRecord.date.desc()).offset(skip).limit(limit).all()
    
    response = []
    for r in records:
        bmi, category, diff = calculate_health_metrics(r.height, r.weight)
        response.append({
            "id": r.id,
            "date": r.date,
            "height": r.height,
            "weight": r.weight,
            "bp_systolic": r.bp_systolic,
            "bp_diastolic": r.bp_diastolic,
            "bmi": bmi,
            "category": category,
            "weight_diff_to_normal": diff
        })
    return response

# Registration API (Backend only for now)
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(database.User).filter(database.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = database.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

# Login API to get token
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter(database.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        request=request, 
        name="dashboard.html"
    )

@app.get("/api/me")
async def read_users_me(current_user: database.User = Depends(auth.get_current_user)):
    return {"username": current_user.username}
