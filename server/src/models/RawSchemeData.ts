import mongoose from "mongoose";

const rawSchemeDataSchema = new mongoose.Schema(
  {
    source_provider: {
      type: String, // e.g., 'myscheme', 'apisetu'
      required: true,
    },
    source_id: {
      type: String, // The ID from the source provider
      required: true,
    },
    raw_data: {
      type: Object, // The full JSON response from the provider
      required: true,
    },
    mapped_scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      default: null, // Null if not yet mapped to our internal Schema
    },
    content_hash: {
      type: String, // MD5 or SHA-256 of the raw data to detect changes
      required: true,
    },
    last_synced_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending_mapping", "mapped", "error"],
      default: "pending_mapping",
    }
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookups
rawSchemeDataSchema.index({ source_provider: 1, source_id: 1 }, { unique: true });

export default mongoose.model("RawSchemeData", rawSchemeDataSchema);
