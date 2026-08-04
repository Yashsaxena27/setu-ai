import mongoose from "mongoose";
import dotenv from "dotenv";
import { aiOrchestrator } from "../services/AIOrchestratorService";
import AIResponseCache from "../models/AIResponseCache";

dotenv.config();

async function runTests() {
  console.log("🚀 Starting AIOrchestratorService Tests...");

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/setu-ai";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const testProfile = {
    name: "Kamla Devi",
    age: 45,
    state: "Uttar Pradesh",
    occupation: "farmer",
    income: 120000,
  };

  try {
    // Test 1: Demo Mode Fixtures
    console.log("\n--- TEST 1: Demo Mode ---");
    process.env.DEMO_MODE = "true";

    const demoExplanation = await aiOrchestrator.request({
      taskType: "why-match",
      profile: testProfile,
      promptBuilderFn: () => "Should not be called",
    });

    const demoScore = await aiOrchestrator.request({
      taskType: "score-narrative",
      profile: testProfile,
      promptBuilderFn: () => "Should not be called",
    });

    console.log("Demo Explanation (why-match) returned:", demoExplanation ? "PASS" : "FAIL");
    console.log("Demo Score (score-narrative) returned:", demoScore ? "PASS" : "FAIL");

    if (demoExplanation.includes("State eligibility matches Uttar Pradesh") && demoScore.includes("100%")) {
      console.log("🟢 TEST 1 PASSED: Served Kamla Devi static fixtures successfully.");
    } else {
      console.log("🔴 TEST 1 FAILED: Incorrect fixture served.");
    }

    // Test 2: Profile Hash Caching (Normal Mode)
    console.log("\n--- TEST 2: Caching ---");
    process.env.DEMO_MODE = "false";

    // Clean previous test cache entry
    const cacheKey = aiOrchestrator.computeCacheKey(testProfile, "scheme123", "why-match");
    await AIResponseCache.deleteOne({ hash: cacheKey });

    // Seed mock cache entry
    const mockValue = "Mock cached explanation string.";
    await AIResponseCache.create({
      hash: cacheKey,
      response: mockValue,
      taskType: "why-match",
    });

    const cachedResult = await aiOrchestrator.request({
      taskType: "why-match",
      profile: testProfile,
      schemeId: "scheme123",
      promptBuilderFn: () => "Should not be called (cached)",
    });

    console.log("Cached response retrieved:", cachedResult);
    if (cachedResult === mockValue) {
      console.log("🟢 TEST 2 PASSED: Cache Hit returned correct stored value. Zero Gemini calls.");
    } else {
      console.log("🔴 TEST 2 FAILED: Cache lookup failed.");
    }

    // Test 3: Batching
    console.log("\n--- TEST 3: Batching debounced requests ---");
    // Ensure cache doesn't hit
    const batchProfile = { ...testProfile, income: 999999 }; // different income changes hash
    const key1 = aiOrchestrator.computeCacheKey(batchProfile, "schemeA", "why-match");
    const key2 = aiOrchestrator.computeCacheKey(batchProfile, "schemeA", "score-narrative");
    await AIResponseCache.deleteMany({ hash: { $in: [key1, key2] } });

    console.log("Triggering 2 parallel batchable requests...");
    const p1 = aiOrchestrator.request({
      taskType: "why-match",
      profile: batchProfile,
      schemeId: "schemeA",
      promptBuilderFn: () => "Prompt for task A",
    });

    const p2 = aiOrchestrator.request({
      taskType: "score-narrative",
      profile: batchProfile,
      schemeId: "schemeA",
      promptBuilderFn: () => "Prompt for task B",
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    console.log("Batch response 1:", r1);
    console.log("Batch response 2:", r2);

    if (r1 && r2) {
      console.log("🟢 TEST 3 PASSED: Batch resolved successfully.");
    } else {
      console.log("🔴 TEST 3 FAILED: Batch execution failed.");
    }

    // Clean up
    await AIResponseCache.deleteOne({ hash: cacheKey });
    await AIResponseCache.deleteMany({ hash: { $in: [key1, key2] } });

  } catch (err) {
    console.error("Test execution encountered an error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

runTests();
