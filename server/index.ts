import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import cookieParser from "cookie-parser";
import { verifyFirebaseToken, requireRole } from "./middleware/auth";
import { createSession, currentUser, setRole } from "./routes/auth";
import { guiderOnly, seekerOnly } from "./routes/protected";

export function createServer() {
  const app = express();

  // Middleware
  // Dynamic CORS reflection: allows localhost in dev and any origin in deployed envs (Vercel),
  // while still supporting credentials. The cors package will echo back the request origin.
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/session", createSession); // exchange idToken -> httpOnly cookie
  app.get("/api/auth/me", verifyFirebaseToken, currentUser);
  app.post("/api/auth/role", verifyFirebaseToken, setRole);

  // Protected, role-based example routes
  app.get("/api/seeker", verifyFirebaseToken, requireRole("seeker"), seekerOnly);
  app.get("/api/guider", verifyFirebaseToken, requireRole("guider"), guiderOnly);

  return app;
}
