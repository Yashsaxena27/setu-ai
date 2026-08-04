import { aiOrchestrator } from "./AIOrchestratorService";

export async function generateEmbedding(text: string) {
  return aiOrchestrator.embed(text);
}