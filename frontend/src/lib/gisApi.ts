const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function fetchShortestPath(lat1: number, lon1: number, lat2: number, lon2: number) {
  const response = await fetch(`${API_BASE_URL}/gis/bhuvan/route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      start: { lat: lat1, lng: lon1 },
      end: { lat: lat2, lng: lon2 }
    })
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch route');
  }
  return response.json();
}
