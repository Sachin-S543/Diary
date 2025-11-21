import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth";
import { entriesRouter } from "./entries";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: "http://localhost:5173", // Vite default
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/health", (_req: express.Request, res: express.Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/entries", entriesRouter);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
