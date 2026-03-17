/*
 * Inkrypt
 * Copyright (C) 2025 Sachin-S543
 * AGPL-3.0-or-later
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from './db';
import { User } from '@secret-capsule/types';
import { sendOtpEmail } from './email';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

if (!JWT_SECRET) {
    console.error('[Auth] FATAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const SendOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
});

const VerifyOtpSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6, 'OTP must be 6 digits'),
});

const SignupSchema = z.object({
    email: z.string().email(),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    otpCode: z.string().length(6, 'OTP must be 6 digits'),
});

const LoginSchema = z.object({
    identifier: z.string().min(1),
    password: z.string().min(1),
});

// ─── Rate limiter helper (simple in-memory, replace with Redis in prod) ────
const otpRequestMap = new Map<string, number>();

const checkOtpRateLimit = (email: string): boolean => {
    const lastRequest = otpRequestMap.get(email.toLowerCase());
    const now = Date.now();
    if (lastRequest && now - lastRequest < 60_000) return false; // 1 request/min
    otpRequestMap.set(email.toLowerCase(), now);
    return true;
};

// ─── Endpoints ────────────────────────────────────────────────────────────

// POST /auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
    try {
        const { email } = SendOtpSchema.parse(req.body);

        if (!checkOtpRateLimit(email)) {
            return res.status(429).json({ message: 'Please wait 1 minute before requesting another code.' });
        }

        // Check email isn't already taken by a verified user
        const existing = await db.findUserByEmail(email);
        if (existing?.emailVerified) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Generate 6-digit OTP
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

        await db.createOtp({
            id: crypto.randomUUID(),
            email: email.toLowerCase(),
            codeHash,
            expiresAt,
            used: false,
            createdAt: new Date().toISOString(),
        });

        await sendOtpEmail(email, code);

        res.json({ message: 'Verification code sent. Check your email.' });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('[Auth] send-otp error:', err);
        res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
});

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, username, password, otpCode } = SignupSchema.parse(req.body);

        // 1. Verify the OTP
        const otpRecord = await db.findLatestOtp(email);
        if (!otpRecord) {
            return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
        }
        if (new Date(otpRecord.expiresAt) < new Date()) {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }
        const codeMatch = await bcrypt.compare(otpCode, otpRecord.codeHash);
        if (!codeMatch) {
            return res.status(400).json({ message: 'Incorrect verification code.' });
        }

        // 2. Check uniqueness
        const existingEmail = await db.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        const existingUsername = await db.findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
        }

        // 3. Create user
        const passwordHash = await bcrypt.hash(password, 12);
        const salt = crypto.randomBytes(16).toString('base64');

        const newUser: User = {
            id: crypto.randomUUID(),
            username,
            email: email.toLowerCase(),
            passwordHash,
            salt,
            emailVerified: true,
            createdAt: new Date().toISOString(),
        };

        await db.createUser(newUser);
        await db.markOtpUsed(otpRecord.id);

        // 4. Issue JWT
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json({ user: safeUser, token });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        console.error('[Auth] signup error:', err);
        res.status(500).json({ message: 'Signup failed. Please try again.' });
    }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { identifier, password } = LoginSchema.parse(req.body);

        let user = await db.findUserByEmail(identifier);
        if (!user) user = await db.findUserByUsername(identifier);

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Incorrect email/username or password.' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const { passwordHash, ...safeUser } = user;
        res.json({ user: safeUser, token });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

// POST /auth/logout
router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully.' });
});

// GET /auth/me
router.get('/me', async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated.' });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await db.findUserById(payload.userId);
        if (!user) return res.status(401).json({ message: 'User not found.' });

        const { passwordHash, ...safeUser } = user;
        res.json({ user: safeUser });
    } catch {
        res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
});

export const authRouter = router;
