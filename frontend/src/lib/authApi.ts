const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function loginV2(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Login failed');
  }
  
  return res.json();
}
