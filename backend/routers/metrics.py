from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

@router.get("/metrics/overview")
def get_overview_metrics():
    return {
        "aqi": {"value": 124, "status": "moderate"},
        "traffic": {"value": 72, "status": "severe"},
        "waste": {"value": 92, "status": "optimal"},
        "water": {"value": 68, "status": "warning"},
        "active_issues": 34,
        "resolved_issues": 120,
        "recent_alerts": [
            {"id": 1, "title": "Water pressure drop in West Zone", "severity": "high", "time": "10 mins ago"},
            {"id": 2, "title": "Traffic jam on Coastal Road", "severity": "medium", "time": "25 mins ago"}
        ]
    }

@router.get("/metrics/road")
def get_road_metrics():
    return {
        "status": "active",
        "potholes_detected": 42,
        "critical_repairs": 8,
        "road_condition_index": 78,
        "data": [
            {"road": "Main Blvd", "condition": 85},
            {"road": "Station Road", "condition": 62},
            {"road": "Coastal Highway", "condition": 92},
            {"road": "Industrial Link", "condition": 45}
        ]
    }

@router.get("/metrics/{category}")
def get_metrics(category: str):
    if category == "traffic":
        return {
            "status": "active",
            "congestion_index": 72,
            "incidents": 14,
            "average_speed_kmh": 32,
            "data": [
                {"time": "08:00", "volume": 1200},
                {"time": "10:00", "volume": 800},
                {"time": "12:00", "volume": 950},
                {"time": "14:00", "volume": 850},
                {"time": "16:00", "volume": 1100},
                {"time": "18:00", "volume": 1600}
            ]
        }
    elif category == "aqi":
        return {
            "status": "moderate",
            "overall_aqi": 124,
            "pm25": 45,
            "pm10": 80,
            "data": [
                {"area": "Vasai West", "aqi": 110},
                {"area": "Vasai East", "aqi": 140},
                {"area": "Virar", "aqi": 98},
                {"area": "Nalasopara", "aqi": 150}
            ]
        }
    elif category == "waste":
        return {
            "status": "optimal",
            "collection_rate": 92,
            "bins_full": 18,
            "data": [
                {"bin_id": "B-101", "fill_level": 85},
                {"bin_id": "B-102", "fill_level": 40},
                {"bin_id": "B-103", "fill_level": 95},
                {"bin_id": "B-104", "fill_level": 20}
            ]
        }
    elif category == "water":
        return {
            "status": "warning",
            "reservoir_level_pct": 68,
            "pressure_faults": 3,
            "data": [
                {"zone": "North", "pressure_psi": 45},
                {"zone": "South", "pressure_psi": 52},
                {"zone": "East", "pressure_psi": 38},
                {"zone": "West", "pressure_psi": 60}
            ]
        }
    elif category == "infrastructure":
        return {
            "status": "active",
            "active_projects": 8,
            "maintenance_alerts": 12,
            "data": [
                {"project": "Metro Line 3", "progress": 65},
                {"project": "Coastal Road", "progress": 82},
                {"project": "Sewage Upgrade", "progress": 40}
            ]
        }
    elif category == "alerts":
        return {
            "alerts": [
                {"id": 1, "type": "critical", "message": "High voltage fluctuation in North Grid", "time": "10m ago"},
                {"id": 2, "type": "warning", "message": "Traffic congestion detected on Main Bypass", "time": "1h ago"},
                {"id": 3, "type": "info", "message": "Scheduled waste collection complete for Zone C", "time": "2h ago"},
                {"id": 4, "type": "critical", "message": "Water pressure drop in Sector 4", "time": "3h ago"}
            ]
        }
    return {"error": "Category not found"}

@router.get("/metrics/map")
def get_map_data():
    return {
        "markers": [
            # Traffic Sensors
            {"id": "TRF-1", "kind": "traffic", "title": "Vasai Highway Sensor", "severity": "warning", "lat": 19.385, "lng": 72.820, "meta": {"Volume": "1200/hr", "Speed": "25km/h"}},
            {"id": "TRF-2", "kind": "traffic", "title": "Nalasopara Station Rd", "severity": "critical", "lat": 19.418, "lng": 72.818, "meta": {"Volume": "850/hr", "Speed": "12km/h", "Status": "Congested"}},
            # AQI Sensors
            {"id": "AQI-1", "kind": "sensor", "title": "Virar East AQI", "severity": "good", "lat": 19.458, "lng": 72.809, "meta": {"AQI": 98, "PM2.5": 32}},
            {"id": "AQI-2", "kind": "sensor", "title": "Nalasopara West AQI", "severity": "critical", "lat": 19.415, "lng": 72.812, "meta": {"AQI": 150, "PM2.5": 85}},
            # Water Stations
            {"id": "WTR-1", "kind": "water", "title": "Vasai Reservoir", "severity": "warning", "lat": 19.375, "lng": 72.830, "meta": {"Level": "68%", "Pressure": "Low"}},
            # Waste Bins
            {"id": "WST-1", "kind": "waste", "title": "Sector 4 Smart Bin", "severity": "critical", "lat": 19.420, "lng": 72.822, "meta": {"Fill": "95%", "Status": "Requires Pickup"}},
            {"id": "WST-2", "kind": "waste", "title": "Market Area Bin", "severity": "good", "lat": 19.412, "lng": 72.825, "meta": {"Fill": "20%", "Status": "Normal"}}
        ]
    }
