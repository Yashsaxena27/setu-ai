import cron from "node-cron";
import { orchestrator } from "../pipeline/PipelineOrchestrator";
import { MySchemeAdapter } from "../pipeline/MySchemeAdapter";

export function initScheduler() {
  // Register adapters
  orchestrator.registerAdapter(new MySchemeAdapter());

  // Run pipeline every day at 2 AM
  cron.schedule("0 2 * * *", () => {
    console.log("Running scheduled pipeline sync...");
    orchestrator.runSync("myscheme", "full")
      .then(log => console.log("Scheduled sync completed", log))
      .catch(err => console.error("Scheduled sync failed", err));
  });

  console.log("Scheduler initialized. Jobs registered.");
}
