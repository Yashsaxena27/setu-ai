import mongoose from "mongoose";

const syncLogSchema = new mongoose.Schema(
  {
    source_provider: {
      type: String,
      required: true,
    },
    sync_type: {
      type: String,
      enum: ["full", "incremental", "manual"],
      required: true,
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },
    start_time: {
      type: Date,
      default: Date.now,
    },
    end_time: {
      type: Date,
    },
    records_processed: {
      type: Number,
      default: 0,
    },
    records_added: {
      type: Number,
      default: 0,
    },
    records_updated: {
      type: Number,
      default: 0,
    },
    records_failed: {
      type: Number,
      default: 0,
    },
    error_message: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SyncLog", syncLogSchema);
