from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

class Coordinates(BaseModel):
    lat: float
    lng: float

class RouteRequest(BaseModel):
    start: Coordinates
    end: Coordinates

@router.post("/bhuvan/route")
async def get_shortest_path(req: RouteRequest):
    token = os.getenv("BHUVAN_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="Bhuvan API token not configured")
    
    url = os.getenv("BHUVAN_API_URL", "https://bhuvan-app1.nrsc.gov.in/api/routing/curl_routing_state.php")
    params = {
        "lat1": req.start.lat,
        "lon1": req.start.lng,
        "lat2": req.end.lat,
        "lon2": req.end.lng,
        "token": token
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params, timeout=15.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Bhuvan API error: {resp.status_code}")
            
            try:
                data = resp.json()
            except ValueError:
                raise HTTPException(status_code=502, detail="Invalid response format from Bhuvan API")

            if not data or not isinstance(data, dict) or data.get("type") != "FeatureCollection" or not data.get("features"):
                raise HTTPException(status_code=404, detail="No route found between these points")
                
            return data
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail="Bhuvan API request failed due to network error")
