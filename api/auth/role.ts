import { z } from 'zod';
import { getFirebaseAdmin, setUserRole } from '../_lib/firebase.js';

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token, true);

    const schema = z.object({ role: z.enum(['seeker', 'guider']) });
    const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
    const parsed = schema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const result = await setUserRole(decoded.uid, parsed.data.role);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).end(JSON.stringify(result));
  } catch (e) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).end(JSON.stringify({ error: 'Failed to set role' }));
  }
}
