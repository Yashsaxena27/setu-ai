import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      enum: [
        "Father",
        "Mother",
        "Brother",
        "Sister",
        "Grandfather",
        "Grandmother",
        "Husband",
        "Wife",
        "Son",
        "Daughter",
        "Guardian",
        "Dependent",
        "Other",
      ],
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    dob: Date,
    occupation: String,
    income: {
      type: Number,
      required: true,
    },
    education: String,
    state: {
      type: String,
      required: true,
    },
    district: String,
    category: String,
    disability: {
      type: Boolean,
      default: false,
    },
    farmer: {
      type: Boolean,
      default: false,
    },
    employmentStatus: String,
    studentStatus: {
      type: Boolean,
      default: false,
    },
    maritalStatus: String,
    dependents: {
      type: Number,
      default: 0,
    },
    language: String,
    phone: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("FamilyMember", familyMemberSchema);
