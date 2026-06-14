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

# Finance Models
class SourceCreate(BaseModel):
    name: str
    balance: float = 0.0

class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    balance: float

class TransactionCreate(BaseModel):
    source_id: int
    amount: float
    type: str # "income" or "expense"
    category: str
    date: Optional[str] = None
    description: Optional[str] = None

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):
        if not v:
            return None
        return str(v)

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_id: int
    source_name: Optional[str] = None
    amount: float
    type: str
    category: str
    date: date
    description: Optional[str] = None

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
    return {**new_record.__dict__, "bmi": bmi, "category": category, "weight_diff_to_normal": diff}

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
            "id": r.id, "date": r.date, "height": r.height, "weight": r.weight,
            "bp_systolic": r.bp_systolic, "bp_diastolic": r.bp_diastolic,
            "bmi": bmi, "category": category, "weight_diff_to_normal": diff
        })
    return response

@app.put("/api/health/{record_id}", response_model=HealthRecordResponse)
async def update_health_record(
    record_id: int,
    record: HealthRecordCreate,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    db_record = db.query(database.HealthRecord).filter(
        database.HealthRecord.id == record_id,
        database.HealthRecord.user_id == current_user.id
    ).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    record_data = record.dict()
    if record_data["date"] and isinstance(record_data["date"], str):
        db_record.date = datetime.strptime(record_data["date"], "%Y-%m-%d").date()
    db_record.height, db_record.weight = record_data["height"], record_data["weight"]
    db_record.bp_systolic, db_record.bp_diastolic = record_data["bp_systolic"], record_data["bp_diastolic"]
    
    db.commit()
    db.refresh(db_record)
    bmi, category, diff = calculate_health_metrics(db_record.height, db_record.weight)
    return {**db_record.__dict__, "bmi": bmi, "category": category, "weight_diff_to_normal": diff}

@app.delete("/api/health/{record_id}")
async def delete_health_record(
    record_id: int,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    db_record = db.query(database.HealthRecord).filter(
        database.HealthRecord.id == record_id,
        database.HealthRecord.user_id == current_user.id
    ).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted successfully"}

# Finance Endpoints
@app.post("/api/sources", response_model=SourceResponse)
async def create_source(
    source: SourceCreate, 
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    new_source = database.Source(**source.dict(), user_id=current_user.id)
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return new_source

@app.get("/api/sources", response_model=List[SourceResponse])
async def list_sources(
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    return db.query(database.Source).filter(database.Source.user_id == current_user.id).all()

@app.post("/api/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate, 
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    source = db.query(database.Source).filter(
        database.Source.id == transaction.source_id,
        database.Source.user_id == current_user.id
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    trans_data = transaction.dict()
    if trans_data["date"]:
        trans_data["date"] = datetime.strptime(trans_data["date"], "%Y-%m-%d").date()
    else:
        trans_data["date"] = date.today()

    new_transaction = database.Transaction(**trans_data, user_id=current_user.id)
    
    # Update source balance
    if new_transaction.type == "income":
        source.balance += new_transaction.amount
    else:
        source.balance -= new_transaction.amount

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    res = TransactionResponse.model_validate(new_transaction)
    res.source_name = source.name
    return res

@app.get("/api/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    skip: int = 0, limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    transactions = db.query(database.Transaction).filter(
        database.Transaction.user_id == current_user.id
    ).order_by(database.Transaction.date.desc()).offset(skip).limit(limit).all()
    
    response = []
    for t in transactions:
        res = TransactionResponse.model_validate(t)
        res.source_name = t.source.name
        response.append(res)
    return response

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(database.get_db),
    current_user: database.User = Depends(auth.get_current_user)
):
    trans = db.query(database.Transaction).filter(
        database.Transaction.id == transaction_id,
        database.Transaction.user_id == current_user.id
    ).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Reverse balance update
    source = trans.source
    if trans.type == "income":
        source.balance -= trans.amount
    else:
        source.balance += trans.amount
        
    db.delete(trans)
    db.commit()
    return {"message": "Transaction deleted"}

# Registration API
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

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(database.User).filter(database.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(request=request, name="dashboard.html")

@app.get("/api/me")
async def read_users_me(current_user: database.User = Depends(auth.get_current_user)):
    return {"username": current_user.username}
