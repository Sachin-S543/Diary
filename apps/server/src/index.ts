/*
 * Secret Capsule (Diary)
 * Copyright (C) 2025 Sachin-S543
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth";
import { capsulesRouter } from "./capsules";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

// Bound JSON body size to prevent payload exhaustion attacks
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// IP-based request throttling
const requestRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 300;

app.use((req, res, next) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'global';
    const now = Date.now();

    const record = requestRateMap.get(clientIp);
    if (!record || now > record.resetAt) {
        requestRateMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return next();
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    record.count++;
    next();
});

// Health Check
app.get("/health", (_req: express.Request, res: express.Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/capsules", capsulesRouter);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
