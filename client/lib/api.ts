const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE || '');

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'omit', // No longer using backend cookies
    headers,
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
  // Login with Firebase via Go GraphQL Gateway
  const result = await api('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation LoginWithFirebase($idToken: String!) {
          loginWithFirebase(idToken: $idToken) {
            accessToken
            expiresIn
            userId
          }
        }
      `,
      variables: { idToken }
    }),
  });
  const token = result?.data?.loginWithFirebase?.accessToken;
  if (token) localStorage.setItem('token', token);
  return result;
}

export async function registerNative(input: any) {
  const result = await api('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation RegisterNative($input: RegisterInput!) {
          registerNative(input: $input) {
            accessToken
            expiresIn
            userId
          }
        }
      `,
      variables: { input }
    }),
  });
  const token = result?.data?.registerNative?.accessToken;
  if (token) localStorage.setItem('token', token);
  return result;
}

export async function loginNative(input: any) {
  const result = await api('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation LoginNative($input: LoginInput!) {
          loginNative(input: $input) {
            accessToken
            expiresIn
            userId
          }
        }
      `,
      variables: { input }
    }),
  });
  const token = result?.data?.loginNative?.accessToken;
  if (token) localStorage.setItem('token', token);
  return result;
}

export async function getMe() {
  const result = await api('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query GetMe {
          me {
            id
            roles
          }
        }
      `
    })
  });
  if (result?.errors) throw new Error("Not logged in");
  const user = result?.data?.me;
  if (!user) return null;
  return {
    uid: user.id,
    role: user.roles?.includes('SEEKER') ? 'seeker' : (user.roles?.includes('GUIDER') ? 'guider' : null)
  };
}

export async function setRole(role: 'seeker' | 'guider') {
  // Map frontend role strings to the GraphQL enum values
  const gqlRole = role === 'guider' ? 'GUIDER' : 'SEEKER';
  const result = await api('/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        mutation SetRole($role: Role!) {
          setRole(role: $role)
        }
      `,
      variables: { role: gqlRole }
    }),
  });
  if (result?.errors) throw new Error(result.errors[0]?.message || 'Failed to set role');
  return result;
}

export async function logout() {
  localStorage.removeItem('token');
  return { success: true };
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
