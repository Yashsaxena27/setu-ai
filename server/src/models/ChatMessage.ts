import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    citations: [
      {
        title: String,
        url: String,
        verified_date: String,
      }
    ],
    confidence: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "High",
    },
    explainability: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
