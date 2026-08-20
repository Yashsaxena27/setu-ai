import dotenv from "dotenv";
import mongoose from "mongoose";
import Scheme from "../models/Scheme";

dotenv.config();

async function audit() {
  console.log("================================================================================");
  console.log("                    SETU AI: DATABASE & EMBEDDING AUDIT                        ");
  console.log("================================================================================");

  try {
    await mongoose.connect(process.env.MONGO_URI!, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB Atlas.");

    const total = await Scheme.countDocuments();
    const active = await Scheme.countDocuments({ is_active: { $ne: false } });
    
    // Find all schemes to inspect embeddings directly
    const allSchemes = await Scheme.find({}).lean();
    
    let withEmbeddings = 0;
    let withoutEmbeddings = 0;
    let invalidEmbeddings = 0;
    const dimensionDistribution: Record<string, number> = {};
    const sampleSchemeEmbeddings: Array<{ name: string; dim: number }> = [];

    for (const s of allSchemes) {
      if (Array.isArray(s.embedding) && s.embedding.length > 0) {
        withEmbeddings++;
        const dim = s.embedding.length;
        dimensionDistribution[`${dim}`] = (dimensionDistribution[`${dim}`] || 0) + 1;
        if (sampleSchemeEmbeddings.length < 5) {
          sampleSchemeEmbeddings.push({ name: s.scheme_name || "Unnamed", dim });
        }
        // Check for NaN or non-number
        const hasInvalid = s.embedding.some((v: any) => typeof v !== "number" || isNaN(v));
        if (hasInvalid) invalidEmbeddings++;
      } else {
        withoutEmbeddings++;
      }
    }

    console.log(`Total Schemes in DB          : ${total}`);
    console.log(`Active Schemes               : ${active}`);
    console.log(`Schemes WITH Embeddings      : ${withEmbeddings} (${Math.round((withEmbeddings / total) * 100)}%)`);
    console.log(`Schemes WITHOUT Embeddings   : ${withoutEmbeddings} (${Math.round((withoutEmbeddings / total) * 100)}%)`);
    console.log(`Invalid / Corrupt Embeddings : ${invalidEmbeddings}`);
    console.log(`Dimension Distribution       :`, dimensionDistribution);
    console.log(`Sample Embedded Schemes      :`, sampleSchemeEmbeddings);

    // Test Atlas Vector Search Aggregation
    console.log("\n--- Testing Atlas $vectorSearch Capability ---");
    try {
      const testVec = Array(3072).fill(0.01);
      const res = await Scheme.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: testVec,
            numCandidates: 10,
            limit: 3,
          },
        },
        {
          $project: {
            scheme_name: 1,
            category: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ]);
      console.log("Atlas $vectorSearch Status   : SUCCESS");
      console.log("Returned Results Count       :", res.length);
      console.log("Sample Result                :", res[0]);
    } catch (vecErr: any) {
      console.log("Atlas $vectorSearch Status   : FAILED / NOT AVAILABLE");
      console.log("Error Message                :", vecErr.message);
    }

    await mongoose.disconnect();
  } catch (err: any) {
    console.error("Database connection error:", err.message);
  }
}

audit();
