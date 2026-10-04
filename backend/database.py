import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The application defaults to SQLite for local development but supports PostGIS 
# via the standard DATABASE_URL environment variable (e.g. postgresql://user:pass@localhost/db).
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./metrocity.db")

# For sqlite we need check_same_thread=False
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
