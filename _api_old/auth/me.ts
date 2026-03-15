import { getFirebaseAdmin, getUserRole, type UserRole } from '../_lib/firebase.js';

function getToken(req: any): string | undefined {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
  const cookie = req.headers['cookie'];
  if (typeof cookie === 'string') {
    const match = cookie.split(/;\s*/).find((c) => c.startsWith('__session='));
    if (match) return decodeURIComponent(match.split('=')[1] || '');
  }
  return undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token, true);
    const roleClaim = (decoded as any).role as UserRole | undefined;
    const role = roleClaim ?? (await getUserRole(decoded.uid)) ?? null;

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).end(JSON.stringify({ uid: decoded.uid, role }));
  } catch (e) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).end(JSON.stringify({ error: 'Invalid or expired token' }));
  }
}
