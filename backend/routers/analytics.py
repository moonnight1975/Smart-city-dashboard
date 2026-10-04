from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

@router.get("/analytics")
def get_analytics():
    weekly_data = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for i, day in enumerate(days):
        weekly_data.append({
            "day": day,
            "complaints": 30 + (i * 2),
            "resolved": 20 + (i * 1.5),
            "airQuality": 90 + (i * 3),
            "traffic": 65 + (i * 2)
        })
        
    return {
        "kpis": [
            {"label": "City Health Score", "value": "78", "unit": "/100", "trend": "+6", "positive": True, "color": "#10b981", "desc": "Combined all factors"},
            {"label": "Response Efficiency", "value": "88", "unit": "%", "trend": "+4%", "positive": True, "color": "#3b82f6", "desc": "Complaints resolved"},
            {"label": "Pollution Index", "value": "58", "unit": "/100", "trend": "-2", "positive": True, "color": "#f59e0b", "desc": "Lower is better"},
            {"label": "Infrastructure Load", "value": "82", "unit": "%", "positive": False, "trend": "+3%", "color": "#ef4444", "desc": "System capacity"}
        ],
        "weekly_trends": weekly_data,
        "complaints_by_area": [
            {"area": "Vasai West", "count": 140},
            {"area": "Nalasopara", "count": 210},
            {"area": "Virar East", "count": 180},
            {"area": "Vasai East", "count": 95}
        ],
        "waste_by_area": [
            {"area": "Vasai West", "tonnes": 45},
            {"area": "Nalasopara", "tonnes": 68},
            {"area": "Virar East", "tonnes": 52},
            {"area": "Vasai East", "tonnes": 30}
        ]
    }
