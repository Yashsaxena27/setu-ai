import mongoose from "mongoose";

const documentVerificationSchema = new mongoose.Schema(
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
    fileName: String,
    fileData: String, // Base64 content
    mimeType: String,
    document_type: String, // e.g. "Aadhaar Card", "Income Certificate"
    ocr_data: {
      name: String,
      dob: String,
      address: String,
      issue_date: String,
      expiry_date: String,
      document_number: String,
      authority: String,
      other_text: String,
    },
    validation_status: {
      type: String,
      default: "Pending", // Pending, Verified, Needs Better Scan, Expired, Wrong Document, Name Mismatch, OCR Confidence Low
    },
    confidence: Number, // 0-100
    quality_score: Number, // 0-100
    quality_issues: [String],
    readiness_score: Number, // 0-100
  },
  {
    timestamps: true,
  }
);

documentVerificationSchema.index({ user_id: 1, scheme_id: 1 });

export default mongoose.model("DocumentVerification", documentVerificationSchema);
