import mongoose from "mongoose";

const systemNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    target_audience: {
      type: String,
      enum: ["All", "State", "District", "Category"],
      default: "All",
    },
    target_value: String,
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SystemNotification", systemNotificationSchema);
