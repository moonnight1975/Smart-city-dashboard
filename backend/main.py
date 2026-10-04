"""
MetroCity Smart City Dashboard - FastAPI Backend
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import random
import math
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import uvicorn
import os
from routers import gis

# Phase 2 Foundation
from database import engine, SessionLocal, get_db
import models
import auth
from sqlalchemy.orm import Session
from fastapi import Depends

models.Base.metadata.create_all(bind=engine)

# Seed initial admin user if not exists
def seed_admin():
    db = SessionLocal()
    if not db.query(models.User).filter_by(email="admin@metrocity.ai").first():
        admin = models.User(
            id="USR-ADMIN",
            name="System Administrator",
            email="admin@metrocity.ai",
            role="admin",
            password_hash=auth.get_password_hash("admin123")
        )
        citizen = models.User(
            id="USR-CITIZEN",
            name="Rahul Sharma",
            email="citizen@metrocity.ai",
            role="citizen",
            password_hash=auth.get_password_hash("citizen123")
        )
        db.add_all([admin, citizen])
        db.commit()
    db.close()

seed_admin()

app = FastAPI(
    title="MetroCity Smart Dashboard API",
    description="Unified Smart City Monitoring and Management API",
    version="1.0.0"
)

from routers import issues as issues_router
from routers import admin as admin_router
from routers import metrics as metrics_router
from routers import analytics as analytics_router
from routers import ai as ai_router

app.include_router(gis.router, prefix="/gis", tags=["GIS"])
app.include_router(issues_router.router, prefix="/api/v2", tags=["Issues"])
app.include_router(admin_router.router, prefix="/api/v2", tags=["Admin"])
app.include_router(metrics_router.router, prefix="/api/v2", tags=["Metrics"])
app.include_router(analytics_router.router, prefix="/api/v2", tags=["Analytics"])
app.include_router(ai_router.router, prefix="/api/v2", tags=["AI"])

# CORS
app.add_middleware(
    CORSMiddleware,
    # Native Expo requests do not send a browser Origin header. These origins
    # keep the API usable from the web dashboard and Expo web during local dev.
    allow_origins=["http://localhost:3000", "https://localhost:3000", "http://localhost:8081", "http://127.0.0.1:8081"],
    allow_origin_regex=r"https?://192\.168\.\d+\.\d+(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────
# Models
# ─────────────────────────────────

class Complaint(BaseModel):
    type: str
    description: str
    location: str
    priority: str = "Medium"
    reported_by: str = "Anonymous"
    area: str = "Unknown"

class ComplaintUpdate(BaseModel):
    status: str  # Open | In Progress | Resolved

class Alert(BaseModel):
    message: str
    type: str  # critical | warning | info
    location: str = "City-wide"
    channels: List[str] = ["App Notification"]

class RoadIssueReport(BaseModel):
    issue_type: str
    description: str
    location: str
    reporter_name: str = "Anonymous"

class AuthLogin(BaseModel):
    email: str
    password: str

class CivicIssueCreate(BaseModel):
    category: str
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    road_id: Optional[str] = None
    reporter_name: str = "Anonymous"
    photo_url: Optional[str] = None

class IssueStatusUpdate(BaseModel):
    status: str
    note: str = ""

class IssueAssignment(BaseModel):
    worker_id: str
    worker_name: str
    department: str = "Roads & Works"
    eta: str = "48 hours"

class RepairEvidence(BaseModel):
    evidence_type: str = "after"
    photo_url: Optional[str] = None
    note: str = ""

class CitizenConfirmation(BaseModel):
    confirmed: bool
    note: str = ""

# ─────────────────────────────────
# In-memory data stores
# ─────────────────────────────────

complaints_db = [
    {"id": "CMP-001", "type": "Pothole", "status": "In Progress", "location": "Main Blvd & 5th St", "priority": "High", "reported_by": "John D.", "timestamp": "2026-04-05T08:30:00Z", "description": "Large pothole causing traffic hazard", "area": "Downtown"},
    {"id": "CMP-002", "type": "Garbage", "status": "Open", "location": "Harbor Park Lane", "priority": "Medium", "reported_by": "Sarah M.", "timestamp": "2026-04-05T09:15:00Z", "description": "Overflowing garbage bins", "area": "Harbor"},
    {"id": "CMP-003", "type": "Streetlight", "status": "Resolved", "location": "North Ring Rd km 4", "priority": "Low", "reported_by": "Mike T.", "timestamp": "2026-04-04T22:10:00Z", "description": "Streetlight off for 3 days", "area": "North"},
]

alerts_db = []
websocket_clients = set()

# Synthetic Nalasopara pilot records. These are demonstration records until
# verified municipal GIS and field-survey data is connected.
roads_db = [
    {"id": "RD-NAL-001", "name": "Tulinj Road", "area": "Nalasopara East", "road_type": "Arterial", "condition_status": "Critical", "condition_score": 28, "priority_score": 92, "verification_status": "Verified", "last_verified_at": "2026-09-22", "complaint_count": 18, "open_complaints": 11, "waterlogging_risk": "High", "maintenance_status": "Proposal pending", "source": "Field survey · synthetic", "lat": 19.4231, "lng": 72.8245},
    {"id": "RD-NAL-002", "name": "Nalasopara–Virar Link Road", "area": "Nalasopara West", "road_type": "Arterial", "condition_status": "Poor", "condition_score": 42, "priority_score": 84, "verification_status": "Verified", "last_verified_at": "2026-09-20", "complaint_count": 13, "open_complaints": 7, "waterlogging_risk": "High", "maintenance_status": "Work in progress", "source": "Field survey · synthetic", "lat": 19.4117, "lng": 72.8068},
    {"id": "RD-NAL-003", "name": "Achole Road", "area": "Achole", "road_type": "Collector", "condition_status": "Poor", "condition_score": 51, "priority_score": 76, "verification_status": "Pending review", "last_verified_at": "2026-09-18", "complaint_count": 9, "open_complaints": 5, "waterlogging_risk": "Medium", "maintenance_status": "Proposal pending", "source": "Citizen reports · synthetic", "lat": 19.4248, "lng": 72.8298},
    {"id": "RD-NAL-004", "name": "Station Road", "area": "Nalasopara East", "road_type": "Arterial", "condition_status": "Needs review", "condition_score": 64, "priority_score": 68, "verification_status": "Verified", "last_verified_at": "2026-09-21", "complaint_count": 7, "open_complaints": 3, "waterlogging_risk": "Medium", "maintenance_status": "Monitoring", "source": "Field survey · synthetic", "lat": 19.4267, "lng": 72.8234},
    {"id": "RD-NAL-005", "name": "Central Park Road", "area": "Nalasopara West", "road_type": "Collector", "condition_status": "Needs review", "condition_score": 69, "priority_score": 57, "verification_status": "Pending review", "last_verified_at": "2026-09-16", "complaint_count": 5, "open_complaints": 2, "waterlogging_risk": "Low", "maintenance_status": "Monitoring", "source": "Citizen reports · synthetic", "lat": 19.4058, "lng": 72.8052},
    {"id": "RD-NAL-006", "name": "Morya Nagar Lane", "area": "Morya Nagar", "road_type": "Local", "condition_status": "Good", "condition_score": 82, "priority_score": 31, "verification_status": "Verified", "last_verified_at": "2026-09-19", "complaint_count": 2, "open_complaints": 0, "waterlogging_risk": "Low", "maintenance_status": "Completed", "source": "Field survey · synthetic", "lat": 19.4178, "lng": 72.8172},
    {"id": "RD-NAL-007", "name": "Don Lane", "area": "Nalasopara West", "road_type": "Local", "condition_status": "Good", "condition_score": 88, "priority_score": 22, "verification_status": "Verified", "last_verified_at": "2026-09-17", "complaint_count": 1, "open_complaints": 0, "waterlogging_risk": "Low", "maintenance_status": "Completed", "source": "Field survey · synthetic", "lat": 19.3998, "lng": 72.8126},
]
road_reports_db = []

demo_users_db = [
    {"id": "USR-ADMIN-001", "name": "Municipal Admin", "email": "admin@metrocity.gov", "password": "admin123", "role": "admin", "department": "Roads & Works"},
    {"id": "USR-CITIZEN-001", "name": "Nalasopara Citizen", "email": "citizen@metrocity.app", "password": "citizen123", "role": "citizen", "department": None},
]
demo_tokens = {"demo-admin-token": "USR-ADMIN-001", "demo-citizen-token": "USR-CITIZEN-001"}
workers_db = [
    {"id": "WRK-001", "name": "R. Patil", "department": "Roads & Works", "availability": "Available", "active_assignments": 1},
    {"id": "WRK-002", "name": "S. Jadhav", "department": "Roads & Works", "availability": "Available", "active_assignments": 2},
    {"id": "WRK-003", "name": "A. More", "department": "Drainage & Flood", "availability": "On site", "active_assignments": 1},
]
issues_db = [
    {"id": "ISS-NAL-001", "category": "Pothole", "title": "Deep pothole near Tulinj Road", "description": "Large road depression affecting two-wheelers.", "location": "Tulinj Road, Nalasopara East", "latitude": 19.4231, "longitude": 72.8245, "road_id": "RD-NAL-001", "reporter_id": "USR-CITIZEN-001", "reporter_name": "Nalasopara Citizen", "status": "Assigned", "priority": "Critical", "priority_score": 92, "grouped_reports": 11, "duplicate_cluster_id": "CLUSTER-TULINJ-01", "assigned_to": {"worker_id": "WRK-001", "worker_name": "R. Patil", "department": "Roads & Works", "eta": "24 hours"}, "evidence": [], "created_at": "2026-09-24T08:20:00Z", "updated_at": "2026-09-25T09:10:00Z"},
    {"id": "ISS-NAL-002", "category": "Waterlogging", "title": "Standing water after rainfall", "description": "Water remains on the carriageway near the station approach.", "location": "Station Road, Nalasopara East", "latitude": 19.4267, "longitude": 72.8234, "road_id": "RD-NAL-004", "reporter_id": "USR-CITIZEN-001", "reporter_name": "Nalasopara Citizen", "status": "Awaiting citizen confirmation", "priority": "High", "priority_score": 78, "grouped_reports": 5, "duplicate_cluster_id": "CLUSTER-STATION-01", "assigned_to": {"worker_id": "WRK-003", "worker_name": "A. More", "department": "Drainage & Flood", "eta": "Completed today"}, "evidence": [{"id": "EVD-001", "evidence_type": "after", "photo_url": None, "note": "Drain cleared and surface dried; inspector review completed.", "uploaded_by": "USR-ADMIN-001", "uploaded_at": "2026-09-25T07:30:00Z"}], "created_at": "2026-09-23T12:15:00Z", "updated_at": "2026-09-25T07:30:00Z"},
    {"id": "ISS-NAL-003", "category": "Broken road edge", "title": "Damaged edge at link road", "description": "Road shoulder has broken away near the west approach.", "location": "Nalasopara–Virar Link Road", "latitude": 19.4117, "longitude": 72.8068, "road_id": "RD-NAL-002", "reporter_id": "USR-CITIZEN-001", "reporter_name": "Nalasopara Citizen", "status": "Submitted", "priority": "High", "priority_score": 84, "grouped_reports": 3, "duplicate_cluster_id": "CLUSTER-LINK-01", "assigned_to": None, "evidence": [], "created_at": "2026-09-25T06:10:00Z", "updated_at": "2026-09-25T06:10:00Z"},
]
issue_status_history_db = [
    {"issue_id": "ISS-NAL-001", "status": "Submitted", "actor": "Citizen", "note": "Report created", "timestamp": "2026-09-24T08:20:00Z"},
    {"issue_id": "ISS-NAL-001", "status": "Verified", "actor": "Municipal Admin", "note": "Photo and location reviewed", "timestamp": "2026-09-24T10:00:00Z"},
    {"issue_id": "ISS-NAL-001", "status": "Assigned", "actor": "Municipal Admin", "note": "Assigned to Roads & Works", "timestamp": "2026-09-25T09:10:00Z"},
]
audit_logs_db = []

government_locations_db = [
    {
        "id": "GOV-VASAI", "name": "Vasai", "district": "Palghar",
        "authority": "Vasai-Virar City Municipal Corporation", "admin_level": "VVMC service area",
        "population_2011": None, "population_scope": "Official Census population is published for the combined VVMC area: 1,222,390 (2011).",
        "district_village_roads_km": 4418, "road_reference_year": "2022-23",
        "data_status": "official_admin_area_with_aggregate_population",
    },
    {
        "id": "GOV-VIRAR", "name": "Virar", "district": "Palghar",
        "authority": "Vasai-Virar City Municipal Corporation", "admin_level": "VVMC service area",
        "population_2011": None, "population_scope": "Official Census population is published for the combined VVMC area: 1,222,390 (2011).",
        "district_village_roads_km": 4418, "road_reference_year": "2022-23",
        "data_status": "official_admin_area_with_aggregate_population",
    },
    {
        "id": "GOV-NALASOPARA", "name": "Nalasopara", "district": "Palghar",
        "authority": "Vasai-Virar City Municipal Corporation", "admin_level": "VVMC service area",
        "population_2011": None, "population_scope": "Official Census population is published for the combined VVMC area: 1,222,390 (2011).",
        "district_village_roads_km": 4418, "road_reference_year": "2022-23",
        "data_status": "official_admin_area_with_aggregate_population",
    },
    {
        "id": "GOV-PALGHAR", "name": "Palghar", "district": "Palghar",
        "authority": "Palghar Municipal Council", "admin_level": "Municipal Council",
        "population_2011": 68930, "population_scope": "Palghar Municipal Council (2011 Census)",
        "district_village_roads_km": 4418, "road_reference_year": "2022-23",
        "data_status": "official_city_record",
    },
]

government_sources = [
    {"title": "Palghar district municipality directory", "url": "https://palghar.gov.in/en/public-utility-category/municipality/", "publisher": "District Palghar, Government of Maharashtra"},
    {"title": "Census 2011 population tables", "url": "https://censusindia.gov.in/nada/index.php/catalog/11346", "publisher": "Office of the Registrar General & Census Commissioner, India"},
    {"title": "Maharashtra infrastructure report", "url": "https://mahades.maharashtra.gov.in/files/publication/Infra2023.pdf", "publisher": "Directorate of Economics and Statistics, Maharashtra"},
    {"title": "Palghar geographical information", "url": "https://palghar.gov.in/en/geographical-information-2/", "publisher": "District Palghar, Government of Maharashtra"},
]

# ─────────────────────────────────
# Helper functions
# ─────────────────────────────────

def generate_aqi(base: int, hour: int) -> int:
    return int(base + math.sin(hour * 0.4) * 25 + random.uniform(-10, 10))

def generate_congestion(base: int, hour: int) -> int:
    return max(5, min(98, int(base + math.sin(hour * 0.6) * 20 + random.uniform(-10, 10))))

def simple_aqi_prediction(current_aqi: int, hour: int) -> dict:
    """Simple linear + sine wave prediction for AQI"""
    predictions = []
    for i in range(1, 7):
        pred_hour = (hour + i) % 24
        pred = generate_aqi(current_aqi, pred_hour)
        predictions.append({"hour": f"{pred_hour:02d}:00", "aqi": pred})
    return predictions

def simple_traffic_prediction(current: int) -> dict:
    """Simple traffic prediction"""
    trend = "improving" if current > 60 else "stable"
    predicted = max(5, current - random.randint(5, 15))
    return {
        "current": current,
        "predicted_30m": predicted,
        "trend": trend,
        "confidence": round(random.uniform(0.72, 0.94), 2)
    }

# ─────────────────────────────────
# ROOT
# ─────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "MetroCity Smart Dashboard API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ─────────────────────────────────
# TRAFFIC ROUTES
# ─────────────────────────────────

@app.get("/traffic/live")
def traffic_live():
    hour = datetime.utcnow().hour
    zones = [
        {"id": 1, "road": "Main Boulevard", "congestion": generate_congestion(87, hour), "speed": random.randint(8, 20), "vehicles": random.randint(2000, 2600), "status": "Heavy"},
        {"id": 2, "road": "Harbor Express", "congestion": generate_congestion(62, hour), "speed": random.randint(22, 38), "vehicles": random.randint(1600, 2000), "status": "Moderate"},
        {"id": 3, "road": "North Ring Road", "congestion": generate_congestion(34, hour), "speed": random.randint(48, 65), "vehicles": random.randint(800, 1200), "status": "Light"},
        {"id": 4, "road": "Airport Corridor", "congestion": generate_congestion(78, hour), "speed": random.randint(14, 24), "vehicles": random.randint(1400, 1800), "status": "Heavy"},
        {"id": 5, "road": "Central Ave", "congestion": generate_congestion(55, hour), "speed": random.randint(30, 45), "vehicles": random.randint(1100, 1500), "status": "Moderate"},
        {"id": 6, "road": "Industrial Bypass", "congestion": generate_congestion(91, hour), "speed": random.randint(5, 14), "vehicles": random.randint(1800, 2300), "status": "Severe"},
    ]
    for z in zones:
        c = z["congestion"]
        z["status"] = "Severe" if c > 85 else "Heavy" if c > 70 else "Moderate" if c > 45 else "Light"
    return {"data": zones, "timestamp": datetime.utcnow().isoformat(), "total_vehicles": sum(z["vehicles"] for z in zones)}

@app.get("/traffic/predict")
def traffic_predict():
    zones = [
        {"road": "Main Blvd", "current_congestion": random.randint(75, 95)},
        {"road": "Harbor Exp", "current_congestion": random.randint(50, 70)},
        {"road": "North Ring", "current_congestion": random.randint(25, 45)},
    ]
    predictions = [{"road": z["road"], **simple_traffic_prediction(z["current_congestion"])} for z in zones]
    return {"predictions": predictions, "timestamp": datetime.utcnow().isoformat()}

# ─────────────────────────────────
# AQI ROUTES
# ─────────────────────────────────

@app.get("/aqi/current")
def aqi_current():
    hour = datetime.utcnow().hour
    zones = [
        {"id": 1, "name": "Downtown", "aqi": generate_aqi(142, hour), "lat": 40.7128, "lng": -74.006, "pm25": round(random.uniform(40, 55), 1), "pm10": round(random.uniform(65, 85), 1), "co": round(random.uniform(0.6, 1.1), 1), "no2": random.randint(30, 50)},
        {"id": 2, "name": "Industrial", "aqi": generate_aqi(218, hour), "lat": 40.728, "lng": -73.98, "pm25": round(random.uniform(75, 100), 1), "pm10": round(random.uniform(120, 150), 1), "co": round(random.uniform(1.8, 2.5), 1), "no2": random.randint(75, 100)},
        {"id": 3, "name": "Residential", "aqi": generate_aqi(67, hour), "lat": 40.705, "lng": -74.025, "pm25": round(random.uniform(15, 25), 1), "pm10": round(random.uniform(28, 40), 1), "co": round(random.uniform(0.3, 0.6), 1), "no2": random.randint(18, 28)},
        {"id": 4, "name": "Green Park", "aqi": generate_aqi(35, hour), "lat": 40.719, "lng": -73.995, "pm25": round(random.uniform(6, 12), 1), "pm10": round(random.uniform(12, 20), 1), "co": round(random.uniform(0.1, 0.3), 1), "no2": random.randint(8, 16)},
        {"id": 5, "name": "Harbor", "aqi": generate_aqi(98, hour), "lat": 40.7, "lng": -74.015, "pm25": round(random.uniform(25, 35), 1), "pm10": round(random.uniform(42, 58), 1), "co": round(random.uniform(0.5, 0.8), 1), "no2": random.randint(26, 38)},
    ]
    for z in zones:
        aqi = z["aqi"]
        z["status"] = "Good" if aqi <= 50 else "Moderate" if aqi <= 100 else "Unhealthy" if aqi <= 150 else "Very Unhealthy" if aqi <= 200 else "Hazardous"
    city_avg = int(sum(z["aqi"] for z in zones) / len(zones))
    return {"zones": zones, "city_average": city_avg, "timestamp": datetime.utcnow().isoformat()}

@app.get("/aqi/history")
def aqi_history():
    base_hour = datetime.utcnow().hour
    history = []
    for i in range(24):
        hr = (base_hour - 23 + i) % 24
        history.append({
            "time": f"{hr:02d}:00",
            "downtown": generate_aqi(142, hr),
            "industrial": generate_aqi(218, hr),
            "residential": generate_aqi(67, hr),
            "greenPark": generate_aqi(35, hr),
        })
    return {"history": history, "timestamp": datetime.utcnow().isoformat()}

@app.get("/aqi/predict")
def aqi_predict():
    hour = datetime.utcnow().hour
    return {
        "predictions": {
            "downtown": simple_aqi_prediction(142, hour),
            "industrial": simple_aqi_prediction(218, hour),
            "greenPark": simple_aqi_prediction(35, hour),
        },
        "model": "linear_regression_v1",
        "accuracy": 0.87,
        "timestamp": datetime.utcnow().isoformat()
    }

# ─────────────────────────────────
# WASTE ROUTES
# ─────────────────────────────────

@app.get("/waste/status")
def waste_status():
    bins = [
        {"id": i+1, "location": loc, "fill": random.randint(fill_base-5, min(fill_base+10, 99)), "type": tp, "last_pickup": pickup}
        for i, (loc, fill_base, tp, pickup) in enumerate([
            ("City Square", 94, "General", "2h ago"),
            ("Harbor Park", 67, "Recyclable", "4h ago"),
            ("North Market", 23, "Organic", "1h ago"),
            ("Tech District", 81, "General", "3h ago"),
            ("Station Area", 45, "General", "30m ago"),
            ("Industrial Zone", 99, "Hazardous", "8h ago"),
            ("Riverside", 12, "Recyclable", "2h ago"),
            ("Mall Entrance", 58, "General", "5h ago"),
        ])
    ]
    for b in bins:
        f = b["fill"]
        b["status"] = "Critical" if f >= 90 else "Warning" if f >= 75 else "Good"
    return {"bins": bins, "critical_count": sum(1 for b in bins if b["status"] == "Critical"), "timestamp": datetime.utcnow().isoformat()}

@app.post("/waste/report")
def waste_report(bin_id: int, fill_level: int):
    return {"success": True, "bin_id": bin_id, "fill_level": fill_level, "message": "Bin status updated", "timestamp": datetime.utcnow().isoformat()}

# ─────────────────────────────────
# WATER ROUTES
# ─────────────────────────────────

@app.get("/water/status")
def water_status():
    zones = [
        {"id": 1, "zone": "Zone A - Central", "pressure": random.randint(68, 78), "quality": round(random.uniform(97, 99.5), 1), "flow": random.randint(1200, 1300), "tempC": round(random.uniform(17, 19), 1)},
        {"id": 2, "zone": "Zone B - North", "pressure": random.randint(63, 73), "quality": round(random.uniform(96, 98), 1), "flow": random.randint(950, 1020), "tempC": round(random.uniform(17, 18.5), 1)},
        {"id": 3, "zone": "Zone C - Industrial", "pressure": random.randint(40, 52), "quality": round(random.uniform(87, 92), 1), "flow": random.randint(580, 660), "tempC": round(random.uniform(20, 23), 1)},
        {"id": 4, "zone": "Zone D - Harbor", "pressure": random.randint(53, 64), "quality": round(random.uniform(94, 97), 1), "flow": random.randint(800, 880), "tempC": round(random.uniform(18, 20), 1)},
        {"id": 5, "zone": "Zone E - South", "pressure": random.randint(25, 38), "quality": round(random.uniform(80, 85), 1), "flow": random.randint(340, 420), "tempC": round(random.uniform(21, 24), 1)},
    ]
    for z in zones:
        p = z["pressure"]
        z["status"] = "Critical" if p < 35 else "Warning" if p < 55 else "Normal"
    return {"zones": zones, "timestamp": datetime.utcnow().isoformat()}

@app.get("/water/alerts")
def water_alerts():
    return {
        "alerts": [
            {"zone": "Zone E - South", "type": "Low Pressure", "value": 31, "threshold": 35, "severity": "critical"},
            {"zone": "Zone C - Industrial", "type": "Quality Warning", "value": 89.3, "threshold": 90, "severity": "warning"},
        ],
        "timestamp": datetime.utcnow().isoformat()
    }

# ─────────────────────────────────
# COMPLAINTS ROUTES
# ─────────────────────────────────

@app.post("/complaints/create")
def create_complaint(complaint: Complaint):
    new_id = f"CMP-{len(complaints_db) + 1:03d}"
    new = {
        "id": new_id,
        "type": complaint.type,
        "description": complaint.description,
        "location": complaint.location,
        "priority": complaint.priority,
        "reported_by": complaint.reported_by,
        "area": complaint.area,
        "status": "Open",
        "timestamp": datetime.utcnow().isoformat(),
    }
    complaints_db.append(new)
    return {"success": True, "complaint": new}

@app.get("/complaints/list")
def list_complaints(status: Optional[str] = None, area: Optional[str] = None):
    result = complaints_db
    if status:
        result = [c for c in result if c["status"] == status]
    if area:
        result = [c for c in result if c["area"].lower() == area.lower()]
    return {"complaints": result, "total": len(result), "timestamp": datetime.utcnow().isoformat()}

@app.put("/complaints/{complaint_id}/update-status")
def update_complaint_status(complaint_id: str, update: ComplaintUpdate):
    for c in complaints_db:
        if c["id"] == complaint_id:
            c["status"] = update.status
            c["updated_at"] = datetime.utcnow().isoformat()
            return {"success": True, "complaint": c}
    raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found")

# ─────────────────────────────────
# NALASOPARA ROAD INTELLIGENCE ROUTES
# ─────────────────────────────────

@app.get("/roads/segments")
def road_segments(status: Optional[str] = None, area: Optional[str] = None):
    result = roads_db
    if status:
        result = [road for road in result if road["condition_status"].lower() == status.lower()]
    if area:
        result = [road for road in result if road["area"].lower() == area.lower()]
    return {"segments": result, "total": len(result), "data_status": "synthetic_demo", "timestamp": datetime.utcnow().isoformat()}

@app.get("/roads/priorities")
def road_priorities():
    ranked = sorted(roads_db, key=lambda road: road["priority_score"], reverse=True)
    return {
        "recommendations": [
            {
                "road_id": road["id"],
                "priority_score": road["priority_score"],
                "recommendation": "Inspect and prepare maintenance proposal" if road["priority_score"] >= 60 else "Continue monitoring",
                "factors": [
                    {"name": "Condition severity", "value": road["condition_score"], "source": road["source"]},
                    {"name": "Open complaints", "value": road["open_complaints"], "source": "Complaint register · synthetic"},
                    {"name": "Waterlogging risk", "value": road["waterlogging_risk"], "source": "Seasonal indicator · synthetic"},
                ],
                "model_version": "ROAD-PRIORITY-v0.1",
                "prediction_date": datetime.utcnow().date().isoformat(),
            }
            for road in ranked
        ],
        "human_review_required": True,
        "data_status": "synthetic_demo",
    }

@app.get("/roads/{road_id}/passport")
def road_passport(road_id: str):
    road = next((item for item in roads_db if item["id"] == road_id), None)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found")
    return {
        "road": road,
        "timeline": [
            {"date": "2026-09-25", "event": "AI priority recommendation generated", "status": "Recommendation"},
            {"date": road["last_verified_at"], "event": "Condition record verified", "status": road["verification_status"]},
            {"date": "2026-09-12", "event": "Citizen reports clustered for review", "status": "Pending validation"},
        ],
        "data_status": "synthetic_demo",
    }

@app.post("/roads/{road_id}/reports")
def create_road_report(road_id: str, report: RoadIssueReport):
    if not any(road["id"] == road_id for road in roads_db):
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found")
    item = {
        "id": f"RPT-NAL-{len(road_reports_db) + 1:03d}",
        "road_id": road_id,
        **report.model_dump(),
        "status": "Pending review",
        "submitted_at": datetime.utcnow().isoformat(),
        "data_status": "synthetic_demo",
    }
    road_reports_db.append(item)
    return {"success": True, "report": item}

@app.get("/government/locations")
def government_locations():
    return {
        "locations": government_locations_db,
        "sources": government_sources,
        "coverage": "Vasai, Virar, Nalasopara and Palghar",
        "data_status": "official_reference_data",
        "important_note": "Census population is 2011 data. VVMC population is an official municipal aggregate and is not split here into Vasai, Virar and Nalasopara.",
        "timestamp": datetime.utcnow().isoformat(),
    }

# ─────────────────────────────────
# AI ROUTES
# ─────────────────────────────────

@app.post("/ai/classify-image")
async def classify_image(file: UploadFile = File(...)):
    """Simulate AI image classification for complaint type detection"""
    await asyncio.sleep(0.5)  # Simulate processing time
    types = ["Pothole", "Garbage Overflow", "Black Smoke", "Water Leak", "Broken Streetlight"]
    confidences = [round(random.uniform(0.78, 0.97), 2) for _ in types]
    top_confidence = max(confidences)
    top_type = types[confidences.index(top_confidence)]
    return {
        "detected_type": top_type,
        "confidence": top_confidence,
        "all_predictions": [{"type": t, "confidence": c} for t, c in zip(types, confidences)],
        "model": "smartcity-classifier-v2",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/ai/suggestions")
def ai_suggestions():
    aqi_val = generate_aqi(142, datetime.utcnow().hour)
    suggestions = []
    if aqi_val > 150:
        suggestions.append({"type": "health", "icon": "🏭", "message": "Issue health advisory for Industrial Zone residents", "priority": "high"})
    suggestions.extend([
        {"type": "traffic", "icon": "🚦", "message": "Divert traffic from Main Blvd via North Ring Rd — saves avg 18 min", "priority": "medium"},
        {"type": "waste", "icon": "🚛", "message": "Deploy 3 additional waste trucks to critical zones (City Square, Industrial)", "priority": "high"},
        {"type": "water", "icon": "💧", "message": "Increase water pressure in Zone E — current 31 PSI below threshold", "priority": "critical"},
    ])
    return {"suggestions": suggestions, "generated_at": datetime.utcnow().isoformat()}

# ─────────────────────────────────
# ALERTS ROUTES
# ─────────────────────────────────

@app.post("/alerts/send")
async def send_alert(alert: Alert):
    new_alert = {
        "id": len(alerts_db) + 1,
        "message": alert.message,
        "type": alert.type,
        "location": alert.location,
        "channels": alert.channels,
        "timestamp": datetime.utcnow().isoformat(),
        "sent_by": "admin"
    }
    alerts_db.append(new_alert)
    # Broadcast to WebSocket clients
    for ws in websocket_clients.copy():
        try:
            await ws.send_text(json.dumps({"event": "new_alert", "data": new_alert}))
        except:
            websocket_clients.discard(ws)
    return {"success": True, "alert": new_alert, "recipients": len(websocket_clients)}

@app.get("/alerts/user")
def user_alerts(limit: int = 10):
    sample_alerts = [
        {"id": 1, "type": "critical", "message": "Severe air quality in Industrial Zone - AQI 218", "time": "5m ago"},
        {"id": 2, "type": "warning", "message": "Traffic congestion on Main Boulevard > 85%", "time": "12m ago"},
        {"id": 3, "type": "info", "message": "Water pressure restored in Zone A", "time": "25m ago"},
        {"id": 4, "type": "critical", "message": "Waste overflow at Industrial Zone — immediate pickup needed", "time": "31m ago"},
        {"id": 5, "type": "warning", "message": "Heavy rain forecast — flood risk in Harbor area", "time": "1h ago"},
    ]
    return {"alerts": sample_alerts[:limit], "count": len(sample_alerts), "timestamp": datetime.utcnow().isoformat()}

# ─────────────────────────────────
# WEBSOCKET
# ─────────────────────────────────

@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await ws.accept()
    websocket_clients.add(ws)
    try:
        while True:
            hour = datetime.utcnow().hour
            data = {
                "event": "live_update",
                "aqi_city_avg": generate_aqi(112, hour),
                "traffic_congestion_avg": generate_congestion(68, hour),
                "active_complaints": len([c for c in complaints_db if c["status"] != "Resolved"]),
                "timestamp": datetime.utcnow().isoformat()
            }
            await ws.send_text(json.dumps(data))
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        websocket_clients.discard(ws)

# ─────────────────────────────────
# OVERVIEW
# ─────────────────────────────────

@app.get("/overview/stats")
def overview_stats():
    hour = datetime.utcnow().hour
    return {
        "total_complaints": len(complaints_db),
        "open_complaints": len([c for c in complaints_db if c["status"] == "Open"]),
        "resolved_today": len([c for c in complaints_db if c["status"] == "Resolved"]),
        "active_alerts": 18,
        "aqi_city_avg": generate_aqi(112, hour),
        "traffic_avg_congestion": generate_congestion(68, hour),
        "water_quality_avg": round(random.uniform(92, 96), 1),
        "waste_critical_bins": 2,
        "timestamp": datetime.utcnow().isoformat()
    }

# ─────────────────────────────────
# ROLE-AWARE CIVIC ISSUE WORKFLOW
# ─────────────────────────────────

ALLOWED_ISSUE_STATUSES = [
    "Submitted", "Verified", "Assigned", "Work in progress",
    "Awaiting citizen confirmation", "Resolved", "Closed", "Reopened", "Rejected",
]

def get_demo_user(token: Optional[str], required_role: Optional[str] = None):
    user_id = demo_tokens.get(token or "")
    user = next((item for item in demo_users_db if item["id"] == user_id), None)
    if not user or (required_role and user["role"] != required_role):
        raise HTTPException(status_code=403, detail=f"{required_role or 'Authenticated'} access required")
    return user

def add_audit(issue_id: str, action: str, actor: dict, note: str = ""):
    audit_logs_db.append({
        "id": f"AUD-{len(audit_logs_db) + 1:04d}",
        "issue_id": issue_id,
        "action": action,
        "actor_id": actor["id"],
        "actor_name": actor["name"],
        "actor_role": actor["role"],
        "note": note,
        "timestamp": datetime.utcnow().isoformat(),
    })

def issue_priority_explanation(issue: dict):
    score = issue.get("priority_score", 50)
    return {
        "score": score,
        "model_version": "ROAD-PRIORITY-v0.2",
        "human_review_required": True,
        "factors": [
            {"factor": "Road condition and category severity", "contribution": round(score * 0.42)},
            {"factor": "Grouped citizen reports", "contribution": min(25, issue.get("grouped_reports", 1) * 2)},
            {"factor": "Waterlogging and public-safety exposure", "contribution": 18 if issue["category"] in ["Waterlogging", "Pothole"] else 9},
            {"factor": "Data freshness and location confidence", "contribution": 8},
        ],
    }

def public_issue(issue: dict):
    safe = dict(issue)
    safe.pop("reporter_id", None)
    safe.pop("reporter_name", None)
    safe["priority_explanation"] = issue_priority_explanation(issue)
    return safe

def find_issue(issue_id: str):
    issue = next((item for item in issues_db if item["id"] == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail=f"Issue {issue_id} not found")
    return issue

def create_civic_issue(payload: dict, reporter: dict):
    road = next((item for item in roads_db if item["id"] == payload.get("road_id")), None)
    priority_score = road["priority_score"] if road else 55
    priority = "Critical" if priority_score >= 85 else "High" if priority_score >= 65 else "Medium"
    now = datetime.utcnow().isoformat()

    duplicate = None
    for item in issues_db:
        same_category = item["category"].lower() == payload["category"].lower()
        same_road = payload.get("road_id") and item.get("road_id") == payload.get("road_id")
        near = False
        if payload.get("latitude") is not None and item.get("latitude") is not None:
            near = abs(payload["latitude"] - item["latitude"]) < 0.002 and abs(payload["longitude"] - item["longitude"]) < 0.002
        if same_category and (same_road or near) and item["status"] not in ["Closed", "Rejected"]:
            duplicate = item
            break

    if duplicate:
        duplicate["grouped_reports"] += 1
        duplicate.setdefault("related_report_ids", []).append(f"REPORT-{duplicate['grouped_reports']:03d}")
        duplicate["updated_at"] = now
        add_audit(duplicate["id"], "duplicate_grouped", reporter, "Citizen report grouped with an existing nearby issue")
        return duplicate, True

    issue = {
        "id": f"ISS-NAL-{len(issues_db) + 1:03d}",
        "category": payload["category"], "title": payload["title"], "description": payload["description"],
        "location": payload["location"], "latitude": payload.get("latitude"), "longitude": payload.get("longitude"),
        "road_id": payload.get("road_id"), "reporter_id": reporter["id"], "reporter_name": payload.get("reporter_name") or reporter["name"],
        "status": "Submitted", "priority": priority, "priority_score": priority_score,
        "grouped_reports": 1, "related_report_ids": [], "duplicate_cluster_id": f"CLUSTER-{len(issues_db) + 1:04d}",
        "assigned_to": None, "evidence": [], "citizen_confirmation": None,
        "created_at": now, "updated_at": now,
    }
    if payload.get("photo_url"):
        issue["evidence"].append({"id": f"EVD-{len(issue['evidence']) + 1:03d}", "evidence_type": "citizen", "photo_url": payload["photo_url"], "note": "Citizen-submitted evidence", "uploaded_by": reporter["id"], "uploaded_at": now})
    issues_db.append(issue)
    issue_status_history_db.append({"issue_id": issue["id"], "status": "Submitted", "actor": reporter["name"], "note": "Citizen report created", "timestamp": now})
    add_audit(issue["id"], "created", reporter, "New civic issue submitted")
    return issue, False

@app.post("/auth/login")
def login(payload: AuthLogin):
    user = next((item for item in demo_users_db if item["email"].lower() == payload.email.lower() and item["password"] == payload.password), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid demo credentials")
    token = next((key for key, value in demo_tokens.items() if value == user["id"]), None)
    return {"token": token, "user": {key: value for key, value in user.items() if key != "password"}, "demo_only": True}

@app.get("/auth/demo-users")
def demo_users():
    return {"users": [{key: value for key, value in user.items() if key != "password"} for user in demo_users_db], "credentials_note": "Use /auth/login with the demo credentials documented in the project README."}

@app.post("/issues")
def create_issue(payload: CivicIssueCreate, x_demo_token: Optional[str] = Header(default=None)):
    citizen = get_demo_user(x_demo_token, "citizen")
    issue, grouped = create_civic_issue(payload.model_dump(), citizen)
    return {"success": True, "grouped_with_existing": grouped, "issue": public_issue(issue)}

@app.get("/issues/public")
def public_issues(status: Optional[str] = None):
    result = [public_issue(item) for item in issues_db if not status or item["status"] == status]
    return {"issues": result, "total": len(result), "timestamp": datetime.utcnow().isoformat()}

@app.get("/citizen/issues")
def citizen_issues(x_demo_token: Optional[str] = Header(default=None)):
    citizen = get_demo_user(x_demo_token, "citizen")
    result = [public_issue(item) for item in issues_db if item.get("reporter_id") == citizen["id"]]
    return {"issues": result, "total": len(result)}

@app.post("/issues/{issue_id}/confirm")
def confirm_issue(issue_id: str, payload: CitizenConfirmation, x_demo_token: Optional[str] = Header(default=None)):
    citizen = get_demo_user(x_demo_token, "citizen")
    issue = find_issue(issue_id)
    if issue.get("reporter_id") != citizen["id"]:
        raise HTTPException(status_code=403, detail="Only the reporting citizen can confirm this issue")
    issue["citizen_confirmation"] = {"confirmed": payload.confirmed, "note": payload.note, "confirmed_by": citizen["id"], "confirmed_at": datetime.utcnow().isoformat()}
    issue["status"] = "Closed" if payload.confirmed else "Reopened"
    issue["updated_at"] = datetime.utcnow().isoformat()
    issue_status_history_db.append({"issue_id": issue_id, "status": issue["status"], "actor": citizen["name"], "note": payload.note or ("Citizen confirmed repair" if payload.confirmed else "Citizen says issue is not fixed"), "timestamp": issue["updated_at"]})
    add_audit(issue_id, "citizen_confirmation", citizen, payload.note)
    return {"success": True, "issue": public_issue(issue)}

@app.get("/admin/issues")
def admin_issues(status: Optional[str] = None, x_demo_token: Optional[str] = Header(default=None)):
    get_demo_user(x_demo_token, "admin")
    result = [dict(item, priority_explanation=issue_priority_explanation(item)) for item in issues_db if not status or item["status"] == status]
    return {"issues": result, "total": len(result), "statuses": ALLOWED_ISSUE_STATUSES}

@app.get("/admin/issues/{issue_id}/timeline")
def admin_issue_timeline(issue_id: str, x_demo_token: Optional[str] = Header(default=None)):
    get_demo_user(x_demo_token, "admin")
    find_issue(issue_id)
    return {"issue_id": issue_id, "status_history": [item for item in issue_status_history_db if item["issue_id"] == issue_id], "audit_log": [item for item in audit_logs_db if item["issue_id"] == issue_id]}

@app.patch("/admin/issues/{issue_id}/status")
def update_issue_status(issue_id: str, payload: IssueStatusUpdate, x_demo_token: Optional[str] = Header(default=None)):
    admin = get_demo_user(x_demo_token, "admin")
    if payload.status not in ALLOWED_ISSUE_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(ALLOWED_ISSUE_STATUSES)}")
    issue = find_issue(issue_id)
    issue["status"] = payload.status
    issue["updated_at"] = datetime.utcnow().isoformat()
    issue_status_history_db.append({"issue_id": issue_id, "status": payload.status, "actor": admin["name"], "note": payload.note, "timestamp": issue["updated_at"]})
    add_audit(issue_id, "status_changed", admin, payload.note or f"Status changed to {payload.status}")
    return {"success": True, "issue": issue}

@app.post("/admin/issues/{issue_id}/assign")
def assign_issue(issue_id: str, payload: IssueAssignment, x_demo_token: Optional[str] = Header(default=None)):
    admin = get_demo_user(x_demo_token, "admin")
    issue = find_issue(issue_id)
    issue["assigned_to"] = payload.model_dump()
    issue["status"] = "Assigned"
    issue["updated_at"] = datetime.utcnow().isoformat()
    issue_status_history_db.append({"issue_id": issue_id, "status": "Assigned", "actor": admin["name"], "note": f"Assigned to {payload.worker_name}", "timestamp": issue["updated_at"]})
    add_audit(issue_id, "assigned", admin, f"Assigned to {payload.worker_name}")
    return {"success": True, "issue": issue}

@app.post("/admin/issues/{issue_id}/evidence")
def add_issue_evidence(issue_id: str, payload: RepairEvidence, x_demo_token: Optional[str] = Header(default=None)):
    admin = get_demo_user(x_demo_token, "admin")
    issue = find_issue(issue_id)
    now = datetime.utcnow().isoformat()
    evidence = {"id": f"EVD-{len(issue['evidence']) + 1:03d}", **payload.model_dump(), "uploaded_by": admin["id"], "uploaded_at": now}
    issue["evidence"].append(evidence)
    if payload.evidence_type == "after":
        issue["status"] = "Awaiting citizen confirmation"
    issue["updated_at"] = now
    issue_status_history_db.append({"issue_id": issue_id, "status": issue["status"], "actor": admin["name"], "note": "Repair evidence uploaded", "timestamp": now})
    add_audit(issue_id, "evidence_uploaded", admin, payload.note)
    return {"success": True, "issue": issue, "evidence": evidence}

@app.get("/admin/workers")
def admin_workers(x_demo_token: Optional[str] = Header(default=None)):
    get_demo_user(x_demo_token, "admin")
    return {"workers": workers_db}

@app.get("/admin/metrics")
def admin_metrics(x_demo_token: Optional[str] = Header(default=None)):
    get_demo_user(x_demo_token, "admin")
    by_status = {status: len([item for item in issues_db if item["status"] == status]) for status in ALLOWED_ISSUE_STATUSES}
    return {"total": len(issues_db), "open": len([item for item in issues_db if item["status"] not in ["Closed", "Rejected"]]), "awaiting_confirmation": by_status["Awaiting citizen confirmation"], "grouped_reports": sum(item.get("grouped_reports", 1) for item in issues_db), "by_status": by_status, "audit_events": len(audit_logs_db)}

# ─────────────────────────────────
# RUN
# ─────────────────────────────────


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/v2/auth/login", response_model=TokenResponse)
def login_v2(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.id, "role": user.role}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
