import mongoose from "mongoose";

const aiResponseCacheSchema = new mongoose.Schema(
  {
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    taskType: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AIResponseCache", aiResponseCacheSchema);
