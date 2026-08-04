import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  scoreIncrease: {
    type: Number,
    required: true,
  },
});

const applicationScoreSchema = new mongoose.Schema(
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
    overall_score: {
      type: Number,
      required: true,
    },
    eligibility_score: {
      type: Number,
      required: true,
    },
    document_score: {
      type: Number,
      required: true,
    },
    profile_score: {
      type: Number,
      required: true,
    },
    verification_score: {
      type: Number,
      required: true,
    },
    draft_score: {
      type: Number,
      required: true,
      default: 0,
    },
    recommendations: [recommendationSchema],
    risk_flags: [String],
  },
  {
    timestamps: true,
  }
);

applicationScoreSchema.index({ user_id: 1, scheme_id: 1 });

export default mongoose.model("ApplicationScore", applicationScoreSchema);
