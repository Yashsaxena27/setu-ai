import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    target: String,
    ip_address: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AdminLog", adminLogSchema);
