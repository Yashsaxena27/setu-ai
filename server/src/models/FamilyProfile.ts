import mongoose from "mongoose";

const familyProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    family_name: {
      type: String,
      default: "My Household",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("FamilyProfile", familyProfileSchema);
