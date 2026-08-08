import mongoose from "mongoose";

const conflictLogSchema = new mongoose.Schema(
  {
    scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    field_name: {
      type: String,
      required: true,
    },
    current_value: {
      type: mongoose.Schema.Types.Mixed,
    },
    incoming_value: {
      type: mongoose.Schema.Types.Mixed,
    },
    source_provider: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unresolved", "resolved_keep_current", "resolved_accept_incoming"],
      default: "unresolved",
    },
    resolved_by: {
      type: String, // Admin user ID if manually resolved
    },
    resolved_at: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ConflictLog", conflictLogSchema);
