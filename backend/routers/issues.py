from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

class IssueSubmit(BaseModel):
    category: str
    title: str
    description: str
    location: str
    lat: Optional[float] = None
    lng: Optional[float] = None

@router.get("/issues")
def get_public_issues(db: Session = Depends(get_db)):
    issues = db.query(models.CivicIssue).order_by(models.CivicIssue.created_at.desc()).all()
    # Serialize
    res = []
    for issue in issues:
        res.append({
            "id": issue.id,
            "category": issue.category,
            "title": f"{issue.category} Report",
            "description": issue.description,
            "location": "Nalasopara" if not issue.lat else f"{issue.lat}, {issue.lng}",
            "lat": issue.lat,
            "lng": issue.lng,
            "status": issue.status,
            "priority": issue.priority,
            "created_at": issue.created_at.isoformat() if issue.created_at else None
        })
    return {"issues": res}

@router.post("/issues")
def submit_issue(payload: IssueSubmit, db: Session = Depends(get_db)):
    # Generate ID
    count = db.query(models.CivicIssue).count()
    issue_id = f"ISSUE-{count + 1000}"
    
    new_issue = models.CivicIssue(
        id=issue_id,
        category=payload.category,
        description=payload.description,
        lat=payload.lat or 19.418,
        lng=payload.lng or 72.818,
        status="Submitted",
        priority="Medium"
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    
    return {"success": True, "issue": {
        "id": new_issue.id,
        "category": new_issue.category,
        "description": new_issue.description,
        "location": "Nalasopara",
        "status": new_issue.status,
        "priority": new_issue.priority,
        "created_at": new_issue.created_at.isoformat() if new_issue.created_at else None
    }}
