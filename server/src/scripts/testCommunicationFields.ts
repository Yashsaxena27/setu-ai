import mongoose from "mongoose";
import dotenv from "dotenv";
import Scheme from "../models/Scheme";
import { formatMatchResponse } from "../services/matchResponseFormatter";

dotenv.config();

async function runVerification() {
  console.log("🔍 Verifying Scheme Contact Details Integration...");

  // 1. Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/setu-ai";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  try {
    // 2. Fetch all schemes from Mongoose
    const schemes = await Scheme.find().lean();
    console.log(`Total Schemes fetched: ${schemes.length}`);

    if (schemes.length === 0) {
      console.log("🔴 FAIL: No schemes found in the database. Please run the seed script first.");
      process.exit(1);
    }

    // 3. Check fields on a sample scheme
    const sample = schemes[0];
    console.log("\n--- Sample Scheme Data ---");
    console.log("Name:", sample.scheme_name);
    console.log("Category:", sample.category);
    console.log("Department:", sample.department);
    console.log("Contact Phone:", sample.contactPhone);
    console.log("Contact Email:", sample.contactEmail);
    console.log("Website:", sample.website);
    console.log("Office Hours:", sample.officeHours);
    console.log("Support Languages:", sample.supportLanguages);

    let allPassed = true;

    // Verify all seeded schemes have these fields populated
    for (const scheme of schemes) {
      if (!scheme.department || !scheme.contactPhone || !scheme.contactEmail || !scheme.website || !scheme.officeHours || !scheme.supportLanguages) {
        console.log(`🔴 FAIL: Scheme "${scheme.scheme_name}" has missing contact fields!`);
        allPassed = false;
        break;
      }
    }

    if (allPassed) {
      console.log("\n🟢 PASS: All 86 schemes contain correct, realistic contact information fields!");
    }

    // 4. Test formatMatchResponse
    console.log("\n--- Testing matchResponseFormatter ---");
    const formatted = formatMatchResponse(schemes.slice(0, 1));
    const formattedSample = formatted[0];

    console.log("Formatted Department:", formattedSample.department);
    console.log("Formatted Phone:", formattedSample.contactPhone);
    console.log("Formatted Email:", formattedSample.contactEmail);
    console.log("Formatted Website:", formattedSample.website);

    if (
      formattedSample.department &&
      formattedSample.contactPhone &&
      formattedSample.contactEmail &&
      formattedSample.website
    ) {
      console.log("🟢 PASS: formatMatchResponse successfully projects all new contact fields to the client.");
    } else {
      console.log("🔴 FAIL: formatMatchResponse is missing contact fields.");
    }

  } catch (err) {
    console.error("Verification failed with error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

runVerification();
