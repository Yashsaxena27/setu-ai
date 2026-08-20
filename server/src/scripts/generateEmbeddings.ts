import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Scheme from "../models/Scheme";
import { generateEmbedding } from "../services/embeddingService";

async function main() {
  console.log("================================================================================");
  console.log("             SETU AI: PRODUCTION EMBEDDING GENERATION & POPULATION              ");
  console.log("================================================================================");
  
  await mongoose.connect(process.env.MONGO_URI!, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB Atlas.");

  const schemes = await Scheme.find({});
  console.log(`Found ${schemes.length} schemes to process.\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < schemes.length; i++) {
    const scheme = schemes[i];
    const rules = scheme.eligibility_rules || {};

    // Build rich semantic document for dense indexing
    const textToEmbed = `
Scheme Name: ${scheme.scheme_name}
Category: ${scheme.category}
Level: ${scheme.level || "Central"}
Target Audience: ${rules.occupation || "All Citizens"}
Age Eligibility: ${rules.min_age || 0} to ${rules.max_age || 100} years
Income Limit: ${rules.income_limit ? `Up to ₹${rules.income_limit}` : "No income limit"}
Applicable States: ${scheme.state_applicability?.join(", ") || "All India"}
Summary: ${scheme.summary_text || ""}
Key Benefits: ${scheme.benefits?.join(". ") || ""}
Tags: ${scheme.tags?.join(", ") || ""}
`.trim();

    process.stdout.write(`[${(i + 1).toString().padStart(2, "0")}/${schemes.length}] Generating embedding for: ${(scheme.scheme_name || "Unnamed").padEnd(50)} `);

    try {
      const embedding = await generateEmbedding(textToEmbed);
      if (embedding && embedding.length > 0) {
        scheme.embedding = embedding;
        await scheme.save();
        updated++;
        console.log(`✅ [${embedding.length} dim]`);
      } else {
        failed++;
        console.log(`❌ [Empty]`);
      }
    } catch (err: any) {
      failed++;
      console.log(`❌ Error: ${err.message}`);
    }

    // Gentle pacing to respect Gemini rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("\n================================================================================");
  console.log(`Successfully embedded ${updated}/${schemes.length} schemes in MongoDB Atlas.`);
  if (failed > 0) {
    console.log(`Failed embeddings: ${failed}`);
  }
  console.log("================================================================================");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});