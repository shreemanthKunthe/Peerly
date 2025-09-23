import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase Admin SDK using either GOOGLE_APPLICATION_CREDENTIALS (default
// ADC) or a JSON string in FIREBASE_SERVICE_ACCOUNT_JSON.
// Also uses FIREBASE_PROJECT_ID when needed.

export function getFirebaseAdmin() {
  // If already initialized (e.g., due to dev server reloads/HMR), reuse it
  if (admin.apps && admin.apps.length > 0) {
    return admin;
  }
  const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (saB64) {
      let creds: any;
      try {
        const decoded = Buffer.from(saB64, "base64").toString("utf8");
        creds = JSON.parse(decoded);
      } catch (e: any) {
        const msg = e?.message || String(e);
        throw new Error(`Failed to load FIREBASE_SERVICE_ACCOUNT_BASE64: ${msg}`);
      }
      const projectId = process.env.FIREBASE_PROJECT_ID || creds.project_id;
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);
      if (!storageBucket) {
        throw new Error(
          "Missing storage bucket. Set FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID in environment."
        );
      }
      console.log('[firebase-admin] init via BASE64', { projectId, storageBucket });
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId,
        storageBucket,
      });
  } else if (saJson) {
      let creds: any;
      try {
        let trimmed = saJson.trim();
        // Remove BOM if present
        if (trimmed.charCodeAt(0) === 0xfeff) trimmed = trimmed.slice(1);
        // Strip surrounding quotes if the whole value is wrapped
        if (
          (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          trimmed = trimmed.slice(1, -1);
        }
        // Normalize problematic unicode whitespace
        trimmed = trimmed
          .replace(/\u00A0/g, " ") // NBSP -> space
          .replace(/\u2028|\u2029/g, "\n"); // line/paragraph sep -> newline

        if (trimmed.startsWith("{")) {
          // Treat as inline JSON
          try {
            creds = JSON.parse(trimmed);
          } catch (e1) {
            try {
              // Some .env files include literal \n sequences instead of real newlines
              const unescaped = trimmed
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r")
                .replace(/\\t/g, "\t");
              creds = JSON.parse(unescaped);
            } catch (e2) {
              // As a last resort, escape real newlines inside the private_key value
              const escapedPrivateKey = trimmed.replace(
                /(\"private_key\"\s*:\s*\")(.*?)(\")/s,
                (_m, p1, p2, p3) => p1 + p2.replace(/\r?\n/g, "\\n") + p3
              );
              creds = JSON.parse(escapedPrivateKey);
            }
          }
        } else if (fs.existsSync(trimmed)) {
          // Treat as file path
          const raw = fs.readFileSync(trimmed, "utf8");
          creds = JSON.parse(raw);
        } else {
          throw new Error(
            "FIREBASE_SERVICE_ACCOUNT_JSON must be a JSON string or a valid path to the service account JSON file"
          );
        }
      } catch (e: any) {
        const msg = e?.message || String(e);
        throw new Error(`Failed to load FIREBASE_SERVICE_ACCOUNT_JSON: ${msg}`);
      }
      const projectId = process.env.FIREBASE_PROJECT_ID || creds.project_id;
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);
      if (!storageBucket) {
        throw new Error(
          "Missing storage bucket. Set FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID in environment."
        );
      }
      console.log('[firebase-admin] init via JSON', { projectId, storageBucket });
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId,
        storageBucket,
      });
  } else {
      // Fallback to default application credentials (GOOGLE_APPLICATION_CREDENTIALS)
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);
      console.log('[firebase-admin] init via ADC', { projectId, storageBucket });
      if (!storageBucket) {
        throw new Error(
          "Missing storage bucket. Set FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID in environment."
        );
      }
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
        storageBucket,
      });
  }
  return admin;
}

export type UserRole = "seeker" | "guider";

export async function setUserRole(uid: string, role: UserRole) {
  const adminApp = getFirebaseAdmin();
  const current = await adminApp.auth().getUser(uid);
  const claims = current.customClaims || {};
  // If role already set, do not change it
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
