import type { Request, Response, NextFunction } from "express";
import { getFirebaseAdmin, getUserRole, type UserRole } from "../firebase";

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; role?: UserRole };
}

function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  // fallback to cookie named "__session" or "token"
  const token = (req as any).cookies?.__session || (req as any).cookies?.token;
  return token;
}

export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token, true);
    const role = (decoded as any).role as UserRole | undefined;

    req.user = { uid: decoded.uid, role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(required: UserRole) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.uid) return res.status(401).json({ error: "Unauthorized" });
      // Prefer claim on token; if not present, fetch from custom claims
      let role = req.user.role;
      if (!role) role = await getUserRole(req.user.uid);
      if (role !== required) {
        return res.status(403).json({ error: "Forbidden: wrong role" });
      }
      next();
    } catch (e) {
      return res.status(500).json({ error: "Role verification failed" });
    }
  };
}
