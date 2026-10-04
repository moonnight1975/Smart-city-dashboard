from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="citizen")
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CivicIssue(Base):
    __tablename__ = "issues"
    id = Column(String, primary_key=True, index=True)
    category = Column(String, index=True)
    description = Column(Text)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    reporter_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="Submitted")
    priority = Column(String, default="Low")
    priority_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class IssueAuditLog(Base):
    __tablename__ = "issue_audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    issue_id = Column(String, ForeignKey("issues.id"))
    actor_id = Column(String, ForeignKey("users.id"))
    action = Column(String)
    note = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(String, primary_key=True, index=True)
    provider = Column(String, nullable=False)
    dataset = Column(String, nullable=False)
    connection_state = Column(String, default="UNAVAILABLE") # LIVE, UPDATED, HISTORICAL, MANUAL, UNAVAILABLE
    last_updated = Column(DateTime(timezone=True))
    coverage = Column(String)
    error_status = Column(String)
    config = Column(JSON)
