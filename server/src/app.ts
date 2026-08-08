import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import matchRoutes from "./routes/match";
import schemeRoutes from "./routes/schemes";
import healthRoutes from "./routes/health";
import draftRoutes from "./routes/draft";
import reminderRoutes from "./routes/reminders";
import vectorRoutes from "./routes/vectorRoutes";
import explainRoutes from "./routes/explain";
import whatsappRoutes from "./routes/whatsapp";
import simulatorRoutes from "./routes/simulator";
import documentRoutes from "./routes/documents";
import applicationScoreRoutes from "./routes/applicationScore";
import applicationRoadmapRoutes from "./routes/applicationRoadmap";
import schemeUpdatesRoutes from "./routes/schemeUpdates";
import familyRoutes from "./routes/family";
import chatRoutes from "./routes/chat";
import digiLockerRoutes from "./routes/digiLocker";
import adminRoutes from "./routes/admin";
import communicationRoutes from "./routes/communication";
import correctionRoutes from "./routes/corrections";
import dashboardRoutes from "./routes/dashboard";
import pipelineRoutes from "./routes/pipeline";
import userApplicationsRoutes from "./routes/userApplications";
import intelligenceRoutes from "./routes/intelligence";
import { initScheduler } from "./scripts/scheduler";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));

// Parse JSON requests
app.use(express.json());

// Parse Twilio webhook form data
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/match", matchRoutes);
app.use("/schemes", schemeRoutes);
app.use("/draft", draftRoutes);
app.use("/reminders", reminderRoutes);
app.use("/health", healthRoutes);
app.use("/vector-search", vectorRoutes);
app.use("/explain", explainRoutes);
app.use("/whatsapp", whatsappRoutes);
app.use("/simulator", simulatorRoutes);
app.use("/documents", documentRoutes);
app.use("/application-score", applicationScoreRoutes);
app.use("/application-roadmap", applicationRoadmapRoutes);
app.use("/scheme-updates", schemeUpdatesRoutes);
app.use("/family", familyRoutes);
app.use("/chat", chatRoutes);
app.use("/digilocker", digiLockerRoutes);
app.use("/admin", adminRoutes);
app.use("/communication", communicationRoutes);
app.use("/corrections", correctionRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/pipeline", pipelineRoutes);
app.use("/applications", userApplicationsRoutes);
app.use("/intelligence", intelligenceRoutes);

// Initialize background jobs
initScheduler();

export default app;