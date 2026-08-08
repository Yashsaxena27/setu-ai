import { Request, Response } from "express";
import { orchestrator } from "../pipeline/PipelineOrchestrator";
import SyncLog from "../models/SyncLog";

export const triggerSync = async (req: Request, res: Response) => {
  const { provider } = req.body;
  if (!provider) {
    return res.status(400).json({ message: "Provider is required" });
  }

  // Trigger asynchronously
  orchestrator.runSync(provider, "manual")
    .then(log => console.log("Manual sync finished", log.status))
    .catch(err => console.error("Manual sync failed", err));

  res.json({ message: `Sync started for provider ${provider}` });
};

export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const logs = await SyncLog.find().sort({ createdAt: -1 }).limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs" });
  }
};
