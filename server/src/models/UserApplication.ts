import mongoose from "mongoose";

const userApplicationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    scheme_name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Not Started",
        "Started",
        "Preparing",
        "Documents Pending",
        "Ready to Apply",
        "Submitted",
        "Under Review",
        "Additional Information Required",
        "Approved",
        "Rejected",
        "Benefit Received",
      ],
      default: "Not Started",
    },
    submitted_date: Date,
    last_updated: {
      type: Date,
      default: Date.now,
    },
    current_stage: String,
    next_action: String,
    pending_documents: [String],
    reference_number: String,
    status_source: {
      type: String,
      enum: ["manual", "adapter_sync"],
      default: "manual",
    },
    rejection_reason: String,
    readinessScore: { type: Number, default: 0 },
    documents: [{
      name: String,
      status: { type: String, enum: ["ready", "missing", "unknown"], default: "unknown" },
      source: String,
    }],
    applicationMethod: String,
    applicationUrl: String,
    applicantSnapshot: { type: mongoose.Schema.Types.Mixed },
    schemeSnapshot: { type: mongoose.Schema.Types.Mixed },
    generatedDraft: String,
    eligibilityExplanation: String,
    passedRules: [String],
    grievance_draft: String,
    reminder_date: Date,
  },
  {
    timestamps: true,
  }
);

userApplicationSchema.index({ user_id: 1, scheme_id: 1 });
userApplicationSchema.index({ user_id: 1, status: 1 });

export default mongoose.model("UserApplication", userApplicationSchema);
