import type { RoadSegment } from '@/lib/mockData';
import { governmentLocations as fallbackGovernmentLocations, governmentSources as fallbackGovernmentSources, type GovernmentLocation, type GovernmentSource } from '@/lib/governmentData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

function normalizeRoad(item: any): RoadSegment {
  return {
    id: item.id,
    name: item.name,
    area: item.area,
    roadType: item.roadType ?? item.road_type,
    conditionStatus: item.conditionStatus ?? item.condition_status,
    conditionScore: item.conditionScore ?? item.condition_score,
    priorityScore: item.priorityScore ?? item.priority_score,
    verificationStatus: item.verificationStatus ?? item.verification_status,
    lastVerifiedAt: item.lastVerifiedAt ?? item.last_verified_at,
    complaintCount: item.complaintCount ?? item.complaint_count,
    openComplaints: item.openComplaints ?? item.open_complaints,
    waterloggingRisk: item.waterloggingRisk ?? item.waterlogging_risk,
    maintenanceStatus: item.maintenanceStatus ?? item.maintenance_status,
    source: item.source,
    lat: item.lat,
    lng: item.lng,
  };
}

function normalizeGovernmentLocation(item: any): GovernmentLocation {
  return {
    id: item.id,
    name: item.name,
    district: item.district,
    authority: item.authority,
    adminLevel: item.adminLevel ?? item.admin_level,
    population2011: item.population2011 ?? item.population_2011 ?? null,
    populationScope: item.populationScope ?? item.population_scope,
    districtVillageRoadsKm: item.districtVillageRoadsKm ?? item.district_village_roads_km,
    roadReferenceYear: item.roadReferenceYear ?? item.road_reference_year,
    dataStatus: item.dataStatus ?? item.data_status,
  };
}

export async function fetchRoadSegments(): Promise<{ roads: RoadSegment[]; connected: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/roads/segments`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Road API unavailable');
    const payload = await response.json();
    return { roads: (payload.segments ?? []).map(normalizeRoad), connected: true };
  } catch {
    return { roads: [], connected: false };
  }
}

export async function fetchGovernmentLocations(): Promise<{
  locations: GovernmentLocation[];
  sources: GovernmentSource[];
  connected: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/government/locations`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Government data API unavailable');
    const payload = await response.json();
    return {
      locations: (payload.locations ?? []).map(normalizeGovernmentLocation),
      sources: payload.sources ?? fallbackGovernmentSources,
      connected: true,
    };
  } catch {
    return { locations: fallbackGovernmentLocations, sources: fallbackGovernmentSources, connected: false };
  }
}

export async function submitRoadIssue(input: { roadId: string; issueType: string; description: string; location: string; reporterName: string }) {
  const response = await fetch(`${API_BASE_URL}/roads/${input.roadId}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue_type: input.issueType, description: input.description, location: input.location, reporter_name: input.reporterName || 'Anonymous' }),
  });
  if (!response.ok) throw new Error('Unable to submit road issue');
  return response.json();
}
