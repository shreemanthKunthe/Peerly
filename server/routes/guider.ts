import type { Request, Response } from "express";
import { verifyFirebaseToken, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { getFirebaseAdmin } from "../firebase";

// Handlers
export async function getGuiderProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const uid = req.user!.uid;
    const admin = getFirebaseAdmin();
    const doc = await admin.firestore().collection("guider_profiles").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Profile not found" });
    return res.json({ id: uid, ...doc.data() });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to load profile" });
  }
}

export async function upsertGuiderProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const uid = req.user!.uid;
    const admin = getFirebaseAdmin();
    const { name, usn, bio, domain, portfolioLink, linkedinLink, profileImageUrl } = req.body || {};
    const data = {
      name: name ?? "",
      usn: usn ?? "",
      bio: bio ?? "",
      domain: domain ?? "",
      portfolioLink: portfolioLink ?? "",
      linkedinLink: linkedinLink ?? "",
      profileImageUrl: profileImageUrl ?? "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    } as any;

    const ref = admin.firestore().collection("guider_profiles").doc(uid);
    const existing = await ref.get();
    if (existing.exists) {
      delete data.createdAt;
      await ref.update(data);
    } else {
      await ref.set(data);
    }

    const saved = await ref.get();
    return res.json({ id: uid, ...saved.data() });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to save profile" });
  }
}

export async function uploadGuiderProfileImage(req: AuthenticatedRequest, res: Response) {
  try {
    const uid = req.user!.uid;
    const admin = getFirebaseAdmin();
    const bucketName = (admin.app().options as any).storageBucket || process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      return res.status(500).json({ error: "Storage bucket not configured. Set FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID." });
    }
    const bucket = admin.storage().bucket(bucketName);

    const { dataUrl, imageBase64, contentType } = (req.body || {}) as {
      dataUrl?: string;
      imageBase64?: string;
      contentType?: string;
    };

    let buffer: Buffer;
    let ct = contentType || "image/jpeg";

    if (dataUrl && dataUrl.startsWith("data:")) {
      const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
      if (!match) return res.status(400).json({ error: "Invalid data URL" });
      ct = match[1] || ct;
      buffer = Buffer.from(match[2], "base64");
    } else if (imageBase64) {
      buffer = Buffer.from(imageBase64, "base64");
    } else {
      return res.status(400).json({ error: "Missing image data" });
    }

    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const filePath = `profile-images/${uid}.${ext}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      resumable: false,
      validation: false,
      metadata: {
        contentType: ct,
        cacheControl: "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return res.json({ url: publicUrl });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to upload image" });
  }
}

// Router factory (optional) if needed elsewhere
export function registerGuiderRoutes(app: import("express").Express) {
  app.get("/api/guider/profile", verifyFirebaseToken, requireRole("guider"), getGuiderProfile);
  app.post("/api/guider/profile", verifyFirebaseToken, requireRole("guider"), upsertGuiderProfile);
  app.post("/api/guider/profile/image", verifyFirebaseToken, requireRole("guider"), uploadGuiderProfileImage);
}
