import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";
import { db } from "./db";
import { User } from "@secret-capsule/types";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod";

const SignupSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});

const LoginSchema = z.object({
    identifier: z.string(), // username or email
    password: z.string(),
});

router.post("/signup", async (req: Request, res: Response) => {
    try {
        const { username, email, password } = SignupSchema.parse(req.body);

        const existingEmail = await db.findUserByEmail(email);
        if (existingEmail) return res.status(400).json({ message: "Email already in use" });

        const existingUser = await db.findUserByUsername(username);
        if (existingUser) return res.status(400).json({ message: "Username already taken" });

        const passwordHash = await bcrypt.hash(password, 10);
        const salt = crypto.randomBytes(16).toString('base64'); // Salt for client-side PBKDF2

        const newUser: User = {
            id: crypto.randomUUID(),
            username,
            email,
            passwordHash,
            salt,
            createdAt: new Date().toISOString(),
        };

        await db.createUser(newUser);

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json({ user: safeUser, token });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Invalid input", error });
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const { identifier, password } = LoginSchema.parse(req.body);

        let user = await db.findUserByEmail(identifier);
        if (!user) {
            user = await db.findUserByUsername(identifier);
        }

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        const { passwordHash, ...safeUser } = user;
        res.json({ user: safeUser, token });
    } catch (error) {
        res.status(400).json({ message: "Invalid input" });
    }
});

router.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});

router.get("/me", async (req: Request, res: Response) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await db.findUserById(payload.userId);
        if (!user) return res.status(401).json({ message: "User not found" });

        const { passwordHash, ...safeUser } = user;
        res.json({ user: safeUser });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

export const authRouter = router;
