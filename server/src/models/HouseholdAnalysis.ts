import mongoose from "mongoose";

const householdAnalysisSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    combined_benefits: {
      type: Number,
      default: 0,
    },
    success_score: {
      type: Number,
      default: 50,
    },
    insights: [String],
    member_analyses: [
      {
        member_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FamilyMember",
        },
        success_score: Number,
        eligible_schemes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheme",
          }
        ],
      }
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("HouseholdAnalysis", householdAnalysisSchema);
