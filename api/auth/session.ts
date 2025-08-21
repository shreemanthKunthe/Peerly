import { z } from 'zod';
import { getFirebaseAdmin, type UserRole } from '../../server/firebase';

function serializeCookie(name: string, value: string, options: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number; // ms
  path?: string;
} = {}) {
  const parts: string[] = [];
  parts.push(`${name}=${encodeURIComponent(value)}`);
  if (options.maxAge) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const schema = z.object({ idToken: z.string().min(10) });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).end(JSON.stringify({ error: 'Invalid payload' }));
  }

  try {
    // Quick sanity check for credentials to reduce opaque 500s in prod
    const hasB64 = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
    const hasJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const hasADC = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!hasB64 && !hasJson && !hasADC) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).end(JSON.stringify({
        error: 'Firebase credentials not configured',
        hint: 'Set FIREBASE_SERVICE_ACCOUNT_BASE64 (recommended) or FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS in your deployment env',
      }));
    }

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(parsed.data.idToken, true);

    const cookie = serializeCookie('__session', parsed.data.idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5 * 1000,
      path: '/',
    });
    res.setHeader('Set-Cookie', cookie);
    res.setHeader('Content-Type', 'application/json');

    const role = (decoded as any).role as UserRole | undefined;
    return res.status(200).end(JSON.stringify({ uid: decoded.uid, role: role ?? null }));
  } catch (e: any) {
    console.error('auth/session failed', e);
    const msg = e?.message || String(e);
    const isAuthErr = /token|auth/i.test(msg);
    res.setHeader('Content-Type', 'application/json');
    return res.status(isAuthErr ? 401 : 500).end(JSON.stringify({ error: isAuthErr ? 'Invalid or expired token' : 'Internal error', detail: process.env.NODE_ENV === 'production' ? undefined : msg }));
  }
}
