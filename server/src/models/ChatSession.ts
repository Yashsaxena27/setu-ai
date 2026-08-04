import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Chat Session",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    last_message_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ChatSession", chatSessionSchema);
