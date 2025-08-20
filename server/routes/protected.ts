import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";

export async function seekerOnly(req: AuthenticatedRequest, res: Response) {
  return res.json({ ok: true, role: "seeker", uid: req.user?.uid });
}

export async function guiderOnly(req: AuthenticatedRequest, res: Response) {
  return res.json({ ok: true, role: "guider", uid: req.user?.uid });
}
