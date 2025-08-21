import type { Request, Response } from "express";
import { z } from "zod";
import { getFirebaseAdmin, setUserRole, getUserRole, type UserRole } from "../firebase";
import type { AuthenticatedRequest } from "../middleware/auth";

// POST /api/auth/session
// Body: { idToken: string }
// Action: verify id token and set cookie("__session") so future requests can be authenticated.
export async function createSession(req: Request, res: Response) {
  const schema = z.object({ idToken: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const admin = getFirebaseAdmin();
  try {
    const decoded = await admin.auth().verifyIdToken(parsed.data.idToken, true);
    // Optionally, you could mint a session cookie; here we reuse ID token for simplicity.
    // Set as HttpOnly cookie to be read server-side only.
    res.cookie("__session", parsed.data.idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
      path: "/",
    });

    const role = (decoded as any).role as UserRole | undefined;
    return res.json({ uid: decoded.uid, role: role ?? null });
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// POST /api/auth/role
// Body: { role: "seeker" | "guider" }
// Requires auth via middleware; sets custom claim once.
export async function setRole(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.uid) return res.status(401).json({ error: "Unauthorized" });
  const schema = z.object({ role: z.enum(["seeker", "guider"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  try {
    const result = await setUserRole(req.user.uid, parsed.data.role);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: "Failed to set role" });
  }
}

// GET /api/auth/me
export async function currentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.uid) return res.status(401).json({ error: "Unauthorized" });
  const role = req.user.role ?? (await getUserRole(req.user.uid));
  return res.json({ uid: req.user.uid, role: role ?? null });
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  // Clear the session cookie
  res.clearCookie("__session", { path: "/" });
  return res.status(200).json({ ok: true });
}
