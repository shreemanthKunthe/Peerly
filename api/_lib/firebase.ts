import admin from 'firebase-admin';

let initialized = false;

export type UserRole = 'seeker' | 'guider';

export function getFirebaseAdmin() {
  if (!initialized) {
    const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (saB64) {
      let creds: any;
      try {
        const decoded = Buffer.from(saB64, 'base64').toString('utf8');
        creds = JSON.parse(decoded);
      } catch (e: any) {
        const msg = e?.message || String(e);
        throw new Error(`Failed to load FIREBASE_SERVICE_ACCOUNT_BASE64: ${msg}`);
      }
      const projectId = process.env.FIREBASE_PROJECT_ID || creds.project_id;
      console.log('[firebase-admin] (api) init via BASE64, projectId=', projectId);
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId,
      });
    } else if (saJson) {
      let creds: any;
      try {
        let trimmed = saJson.trim();
        if (trimmed.charCodeAt(0) === 0xfeff) trimmed = trimmed.slice(1);
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          trimmed = trimmed.slice(1, -1);
        }
        trimmed = trimmed.replace(/\u00A0/g, ' ').replace(/\u2028|\u2029/g, '\n');
        if (trimmed.startsWith('{')) {
          try {
            creds = JSON.parse(trimmed);
          } catch {
            try {
              const unescaped = trimmed.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
              creds = JSON.parse(unescaped);
            } catch {
              const escapedPrivateKey = trimmed.replace(/("private_key"\s*:\s*")(.*?)(")/s, (_m, p1, p2, p3) => p1 + p2.replace(/\r?\n/g, '\\n') + p3);
              creds = JSON.parse(escapedPrivateKey);
            }
          }
        } else {
          // As a last resort, treat as file path is not supported reliably in serverless; prefer JSON/BASE64
          throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be JSON in serverless environment');
        }
      } catch (e: any) {
        const msg = e?.message || String(e);
        throw new Error(`Failed to load FIREBASE_SERVICE_ACCOUNT_JSON: ${msg}`);
      }
      const projectId = process.env.FIREBASE_PROJECT_ID || creds.project_id;
      console.log('[firebase-admin] (api) init via JSON, projectId=', projectId);
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId,
      });
    } else {
      console.log('[firebase-admin] (api) init via ADC, projectId=', process.env.FIREBASE_PROJECT_ID);
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    initialized = true;
  }
  return admin;
}

export async function setUserRole(uid: string, role: UserRole) {
  const adminApp = getFirebaseAdmin();
  const current = await adminApp.auth().getUser(uid);
  const claims = current.customClaims || {};
  if (claims.role && claims.role !== role) {
    return { unchanged: true, role: claims.role as UserRole };
  }
  if (claims.role === role) {
    return { unchanged: true, role };
  }
  await adminApp.auth().setCustomUserClaims(uid, { ...claims, role });
  return { unchanged: false, role };
}

export async function getUserRole(uid: string): Promise<UserRole | undefined> {
  const adminApp = getFirebaseAdmin();
  const user = await adminApp.auth().getUser(uid);
  return (user.customClaims?.role as UserRole | undefined) ?? undefined;
}
