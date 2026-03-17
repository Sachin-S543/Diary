/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { Capsule } from '@secret-capsule/types';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthRequest extends Request {
    userId?: string;
}

// ─── Auth middleware ───────────────────────────────────────────────────────
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated.' });
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.userId = payload.userId;
        next();
    } catch {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
};

router.use(authenticate as any);

// ─── Schemas ───────────────────────────────────────────────────────────────
const CapsuleSchema = z.object({
    encryptedTitle: z.string().default(''),
    encryptedContent: z.string(),
    iv: z.string().default(''),
    salt: z.string().default(''),
    hmac: z.string().default(''),
    size: z.number().default(0),
    category: z.string().default(''),
    tags: z.array(z.string()).default([]),
    unlockAt: z.string().optional(),
    aura: z.string().optional(),
    id: z.string().optional(),
});

// ─── Routes ────────────────────────────────────────────────────────────────

// GET /capsules?category=&tag=
router.get('/', async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized.' });
    try {
        const { category, tag } = req.query as { category?: string; tag?: string };
        const capsules = await db.getCapsules(req.userId, { category, tag });
        res.json(capsules);
    } catch (err) {
        console.error('[Capsules] GET error:', err);
        res.status(500).json({ message: 'Failed to fetch entries.' });
    }
});

// GET /capsules/meta — categories and tags for the authenticated user
router.get('/meta', async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized.' });
    try {
        const [categories, tags] = await Promise.all([
            db.getUserCategories(req.userId),
            db.getUserTags(req.userId),
        ]);
        res.json({ categories, tags });
    } catch (err) {
        console.error('[Capsules] GET /meta error:', err);
        res.status(500).json({ message: 'Failed to fetch metadata.' });
    }
});

// POST /capsules
router.post('/', async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized.' });
    try {
        const data = CapsuleSchema.parse(req.body);
        const now = new Date().toISOString();

        const capsule: Capsule = {
            id: data.id || crypto.randomUUID(),
            userId: req.userId,
            encryptedTitle: data.encryptedTitle,
            encryptedContent: data.encryptedContent,
            iv: data.iv,
            salt: data.salt,
            hmac: data.hmac,
            size: data.size,
            category: data.category,
            tags: data.tags,
            createdAt: now,
            updatedAt: now,
            unlockAt: data.unlockAt,
            aura: data.aura,
        };

        await db.createCapsule(capsule);
        res.status(201).json(capsule);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('[Capsules] POST error:', err);
        res.status(500).json({ message: 'Failed to create entry.' });
    }
});

// PUT /capsules/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized.' });
    try {
        const existing = await db.getCapsuleById(req.params.id, req.userId);
        if (!existing) return res.status(404).json({ message: 'Entry not found.' });

        const data = CapsuleSchema.parse(req.body);
        const updated: Capsule = {
            ...existing,
            encryptedTitle: data.encryptedTitle,
            encryptedContent: data.encryptedContent,
            iv: data.iv,
            salt: data.salt,
            hmac: data.hmac,
            size: data.size,
            category: data.category,
            tags: data.tags,
            updatedAt: new Date().toISOString(),
            unlockAt: data.unlockAt,
            aura: data.aura,
        };

        await db.updateCapsule(updated);
        res.json(updated);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('[Capsules] PUT error:', err);
        res.status(500).json({ message: 'Failed to update entry.' });
    }
});

// DELETE /capsules/:id — ownership enforced at DB level
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized.' });
    try {
        const existing = await db.getCapsuleById(req.params.id, req.userId);
        if (!existing) return res.status(404).json({ message: 'Entry not found or not yours.' });

        await db.deleteCapsule(req.params.id, req.userId);
        res.json({ success: true });
    } catch (err) {
        console.error('[Capsules] DELETE error:', err);
        res.status(500).json({ message: 'Failed to delete entry.' });
    }
});

export const capsulesRouter = router;
