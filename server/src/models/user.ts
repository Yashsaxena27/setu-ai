import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      unique: true,
    },

    password: String,

    age: String,

    gender: String,

    state: String,

    district: String,

    occupation: String,

    income: String,

    education: String,

    disability: String,

    language: String,

    phone: String,

    consent_given: Boolean,

    consent_timestamp: Date,

    role: {
      type: String,
      enum: ["Citizen", "Moderator", "Scheme Editor", "District Admin", "State Admin", "Super Admin"],
      default: "Citizen",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({
  state: 1,
  occupation: 1,
  income: 1,
});

export default mongoose.model("User", userSchema);