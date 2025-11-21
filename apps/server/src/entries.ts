import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { DiaryEntry } from "@secret-capsule/types";

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

const CreateEntrySchema = z.object({
    title: z.string(), // Encrypted string
    content: z.string(), // Encrypted string
    tags: z.array(z.string()).default([]), // Encrypted strings
});

router.get("/", async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const entries = await db.getEntries(req.userId);
    res.json(entries);
});

router.post("/", async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
        const { title, content, tags } = CreateEntrySchema.parse(req.body);

        const newEntry: DiaryEntry = {
            id: Math.random().toString(36).substring(7),
            userId: req.userId,
            title,
            content,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.createEntry(newEntry);
        res.status(201).json(newEntry);
    } catch (error) {
        res.status(400).json({ message: "Invalid input" });
    }
});

export const entriesRouter = router;
