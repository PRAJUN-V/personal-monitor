from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import create_engine
import datetime

import os

# Use DATABASE_URL from environment (Neon/Postgres), fallback to local SQLite for development
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./personal_monitor.db")

# For PostgreSQL (Neon), the URL must start with postgresql:// (Render sometimes provides postgres://)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    health_records = relationship("HealthRecord", back_populates="owner")

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, default=datetime.date.today)
    height = Column(Float) # in cm
    weight = Column(Float) # in kg
    bp_systolic = Column(Integer)
    bp_diastolic = Column(Integer)

    owner = relationship("User", back_populates="health_records")

# Base.metadata.create_all(bind=engine) - Removed, using Alembic migrations

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
