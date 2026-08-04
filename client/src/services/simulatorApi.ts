import { api } from "./api";

export async function simulateEligibility(
  originalProfile: any,
  simulatedProfile: any
) {
  return api<{
    gained: any[];
    lost: any[];
    unchanged: any[];
    summary: any;
  }>("/simulator", {
    method: "POST",
    body: JSON.stringify({
      originalProfile,
      simulatedProfile,
    }),
  });
}