import { CivicIssue } from './issueApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function fetchPublicIssues(): Promise<CivicIssue[]> {
  const response = await fetch(`${API_BASE_URL}/api/v2/issues`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load issues');
  const payload = await response.json();
  return payload.issues ?? [];
}

export async function submitIssue(data: any): Promise<CivicIssue> {
  let token = 'demo-citizen-token';
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('metrocity_token');
    if (stored) token = stored;
  }
  const response = await fetch(`${API_BASE_URL}/api/v2/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-token': token },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Unable to submit issue');
  const payload = await response.json();
  return payload.issue;
}
