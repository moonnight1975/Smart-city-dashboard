export type IssueStatus = 'Submitted' | 'Verified' | 'Assigned' | 'Work in progress' | 'Awaiting citizen confirmation' | 'Resolved' | 'Closed' | 'Reopened' | 'Rejected';

export type CivicIssue = {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  road_id?: string | null;
  reporter_name?: string;
  status: IssueStatus;
  priority: string;
  priority_score: number;
  grouped_reports: number;
  duplicate_cluster_id: string;
  assigned_to: { worker_id: string; worker_name: string; department: string; eta: string } | null;
  evidence: Array<{ id: string; evidence_type: string; photo_url?: string | null; note: string; uploaded_at: string }>;
  citizen_confirmation?: { confirmed: boolean; note: string; confirmed_at: string } | null;
  priority_explanation?: { score: number; model_version: string; human_review_required: boolean; factors: Array<{ factor: string; contribution: number }> };
  created_at: string;
  updated_at: string;
};

export type Worker = { id: string; name: string; department: string; availability: string; active_assignments: number };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const adminHeaders = () => {
  let token = 'demo-admin-token'; // Fallback
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('metrocity_token');
    if (stored) token = stored;
  }
  return { 'Content-Type': 'application/json', 'x-demo-token': token };
};

export async function fetchAdminIssues(): Promise<CivicIssue[]> {
  const response = await fetch(`${API_BASE_URL}/api/v2/admin/issues`, { headers: adminHeaders(), cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load admin issues');
  const payload = await response.json();
  return payload.issues ?? [];
}

export async function fetchAdminMetrics() {
  const response = await fetch(`${API_BASE_URL}/api/v2/admin/metrics`, { headers: adminHeaders(), cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load admin metrics');
  return response.json();
}

export async function fetchWorkers(): Promise<Worker[]> {
  const response = await fetch(`${API_BASE_URL}/api/v2/admin/workers`, { headers: adminHeaders(), cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load workers');
  const payload = await response.json();
  return payload.workers ?? [];
}

export async function updateIssueStatus(issueId: string, status: IssueStatus, note: string) {
  const response = await fetch(`${API_BASE_URL}/api/v2/admin/issues/${issueId}/status`, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify({ status, note }) });
  if (!response.ok) throw new Error('Unable to update issue status');
  return response.json();
}

export async function assignIssue(issueId: string, worker: Worker) {
  const response = await fetch(`${API_BASE_URL}/api/v2/admin/issues/${issueId}/assign`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ worker_id: worker.id, worker_name: worker.name, department: worker.department, eta: '48 hours' }) });
  if (!response.ok) throw new Error('Unable to assign issue');
  return response.json();
}

export async function uploadRepairEvidence(issueId: string, note: string, evidenceType = 'after') {
  const response = await fetch(`${API_BASE_URL}/api/v2/admin/issues/${issueId}/evidence`, { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ evidence_type: evidenceType, note }) });
  if (!response.ok) throw new Error('Unable to upload repair evidence');
  return response.json();
}
