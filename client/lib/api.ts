const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE || '');

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : (await res.text() as any);
}

export async function createSession(idToken: string) {
  return api('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export async function getMe() {
  return api('/api/auth/me');
}

export async function setRole(role: 'seeker' | 'guider') {
  return api('/api/auth/role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function logout() {
  return api('/api/auth/logout', { method: 'POST' });
}

// Guider profile module
export type GuiderProfile = {
  id: string;
  name: string;
  usn: string;
  bio: string;
  domain: string;
  portfolioLink?: string;
  linkedinLink?: string;
  profileImageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function getGuiderProfile() {
  return api<GuiderProfile>('/api/guider/profile');
}

export async function upsertGuiderProfile(payload: Partial<GuiderProfile>) {
  return api<GuiderProfile>('/api/guider/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadGuiderProfileImage(dataUrl: string) {
  return api<{ url: string }>('/api/guider/profile/image', {
    method: 'POST',
    body: JSON.stringify({ dataUrl }),
  });
}
