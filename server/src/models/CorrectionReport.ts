import mongoose from "mongoose";

const correctionReportSchema = new mongoose.Schema(
  {
    scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    field_name: {
      type: String,
      required: true,
    },
    user_report: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "fixed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CorrectionReport", correctionReportSchema);
