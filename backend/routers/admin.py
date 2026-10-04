from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models
from pydantic import BaseModel
import auth

router = APIRouter()

class IssueStatusUpdate(BaseModel):
    status: str
    note: str

@router.get("/admin/issues")
def get_admin_issues(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.CivicIssue).order_by(models.CivicIssue.created_at.desc())
    if status:
        query = query.filter(models.CivicIssue.status == status)
    issues = query.all()
    
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
            "priority_score": issue.priority_score,
            "grouped_reports": 0,
            "duplicate_cluster_id": "none",
            "created_at": issue.created_at.isoformat() if issue.created_at else None,
            "updated_at": issue.updated_at.isoformat() if issue.updated_at else None
        })
    return {"issues": res, "total": len(res)}

@router.patch("/admin/issues/{issue_id}/status")
def update_issue_status(issue_id: str, payload: IssueStatusUpdate, db: Session = Depends(get_db)):
    issue = db.query(models.CivicIssue).filter(models.CivicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    issue.status = payload.status
    db.commit()
    
    # Audit log
    audit = models.IssueAuditLog(
        issue_id=issue.id,
        actor_id="USR-ADMIN",
        action="status_changed",
        note=payload.note
    )
    db.add(audit)
    db.commit()
    return {"success": True}

@router.get("/admin/workers")
def get_workers():
    # Return dummy workers for UI purposes since we don't have a Worker table yet
    return {"workers": [
        {"id": "W-01", "name": "Rajesh Kumar", "department": "Roads", "availability": "Available", "active_assignments": 1},
        {"id": "W-02", "name": "Suresh Patel", "department": "Water", "availability": "Busy", "active_assignments": 3}
    ]}

@router.get("/admin/metrics")
def get_admin_metrics(db: Session = Depends(get_db)):
    total = db.query(models.CivicIssue).count()
    resolved = db.query(models.CivicIssue).filter(models.CivicIssue.status.in_(["Resolved", "Closed"])).count()
    return {
        "total_issues": total,
        "resolved_issues": resolved,
        "active_workers": 12,
        "avg_resolution_time_hrs": 42
    }

@router.get("/admin/users")
def get_admin_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    res = []
    for u in users:
        res.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "status": "Active"
        })
    return {"users": res}

@router.get("/admin/data_sources")
def get_data_sources(db: Session = Depends(get_db)):
    sources = db.query(models.DataSource).all()
    res = []
    for s in sources:
        res.append({
            "id": s.id,
            "provider": s.provider,
            "dataset": s.dataset,
            "connection_state": s.connection_state,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None,
            "coverage": s.coverage,
            "error_status": s.error_status
        })
    return {"data_sources": res}

@router.get("/admin/audit_logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.IssueAuditLog).order_by(models.IssueAuditLog.timestamp.desc()).limit(100).all()
    res = []
    for lg in logs:
        res.append({
            "id": lg.id,
            "issue_id": lg.issue_id,
            "actor_id": lg.actor_id,
            "action": lg.action,
            "note": lg.note,
            "timestamp": lg.timestamp.isoformat() if lg.timestamp else None
        })
    return {"logs": res}

@router.get("/admin/settings")
def get_admin_settings():
    return {
        "settings": {
            "maintenanceMode": False,
            "demoMode": True,
            "enableAI": True,
            "enableNotifications": True,
            "refreshIntervalSec": 30,
            "aqiCritical": 150,
            "trafficAlertPct": 80,
            "binFillCriticalPct": 90,
        }
    }

class SettingsUpdate(BaseModel):
    maintenanceMode: bool
    demoMode: bool
    enableAI: bool
    enableNotifications: bool
    refreshIntervalSec: int
    aqiCritical: int
    trafficAlertPct: int
    binFillCriticalPct: int

@router.post("/admin/settings")
def update_admin_settings(payload: SettingsUpdate):
    return {"success": True, "message": "Settings updated"}
