import mongoose from "mongoose";

const ApplicationEventSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserApplication' },
  type: String,
  timestamp: { type: Date, default: Date.now },
  source: String
});

export default mongoose.model("ApplicationEvent", ApplicationEventSchema);
