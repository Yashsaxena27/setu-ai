import mongoose from "mongoose";

const communicationLogSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["WhatsApp", "SMS", "Voice", "Email"],
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ["Incoming", "Outgoing"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    success: {
      type: Boolean,
      default: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

communicationLogSchema.index({ sender: 1, channel: 1 });
communicationLogSchema.index({ createdAt: -1 });

export default mongoose.model("CommunicationLog", communicationLogSchema);
