import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { Capsule } from "@secret-capsule/types";
import crypto from "crypto";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod";

interface AuthRequest extends Request {
    userId?: string;
}

// Middleware to authenticate user
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = payload.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

router.use(authenticate as any);

const CreateCapsuleSchema = z.object({
    encryptedTitle: z.string(),
    encryptedContent: z.string(),
    iv: z.string(),
    salt: z.string(),
    hmac: z.string(),
    size: z.number(),
});

router.get("/", async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const capsules = await db.getCapsules(req.userId);
    res.json(capsules);
});

router.post("/", async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
        const data = CreateCapsuleSchema.parse(req.body);

        const newCapsule: Capsule = {
            id: crypto.randomUUID(),
            userId: req.userId,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.createCapsule(newCapsule);
        res.status(201).json(newCapsule);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Invalid input" });
    }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
        // Verify ownership (TODO: Add getCapsuleById to DB to verify ownership before delete)
        // For now, just delete. DB logic should ideally check userId.
        // But `deleteCapsule` in DB just deletes by ID. 
        // Secure implementation requires checking ownership.

        // Let's fetch all user capsules and check if ID exists
        const capsules = await db.getCapsules(req.userId);
        const exists = capsules.find(c => c.id === req.params.id);
        if (!exists) return res.status(404).json({ message: "Capsule not found" });

        await db.deleteCapsule(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export const capsulesRouter = router;
