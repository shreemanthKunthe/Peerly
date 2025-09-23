import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { createSession, currentUser, setRole, logout } from "./routes/auth";
import { guiderOnly, seekerOnly } from "./routes/protected";
import { requireRole, verifyFirebaseToken } from "./middleware/auth";
import { registerGuiderRoutes } from "./routes/guider";
import { getFirebaseAdmin } from "./firebase";

export function createServer() {
  const app = express();

  // Middleware
  // Dynamic CORS reflection: allows localhost in dev and any origin in deployed envs (Vercel),
  // while still supporting credentials. The cors package will echo back the request origin.
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Diagnostics (non-production): report Firebase initialization and bucket existence
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/admin/firebase-info", async (_req, res) => {
      try {
        const admin = getFirebaseAdmin();
        const projectId = (admin.app().options as any).projectId || process.env.FIREBASE_PROJECT_ID;
        const storageBucket = (admin.app().options as any).storageBucket || process.env.FIREBASE_STORAGE_BUCKET;
        let bucketExists: boolean | undefined = undefined;
        if (storageBucket) {
          const [exists] = await admin.storage().bucket(storageBucket).exists();
          bucketExists = !!exists;
        }
        res.json({ projectId, storageBucket, bucketExists });
      } catch (e: any) {
        res.status(500).json({ error: e?.message || String(e) });
      }
    });
  }

  // Auth routes
  app.post("/api/auth/session", createSession);
  app.get("/api/auth/me", verifyFirebaseToken, currentUser);
  app.post("/api/auth/role", verifyFirebaseToken, setRole);
  app.post("/api/auth/logout", logout);

  // Protected routes (role-based)
  app.get(
    "/api/protected/seeker",
    verifyFirebaseToken,
    requireRole("seeker"),
    seekerOnly,
  );
  app.get(
    "/api/protected/guider",
    verifyFirebaseToken,
    requireRole("guider"),
    guiderOnly,
  );

  // Guider profile module
  registerGuiderRoutes(app);

  return app;
}
