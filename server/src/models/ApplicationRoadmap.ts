import mongoose from "mongoose";

const roadmapStepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Completed", "Pending", "Locked"],
    default: "Locked",
  },
  description: String,
  estimated_time: String,
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Low",
  },
  icon: String,
  details: {
    whyRequired: String,
    whereObtain: String,
    cost: String,
    processingTime: String,
    office: String,
    portal: String,
    reqDocuments: [String],
    tips: [String],
    aiSuggestions: String,
  },
  resources: {
    website: String,
    downloadForms: [String],
    helpline: String,
    office: String,
    mapLocation: String,
  },
});

const applicationRoadmapSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    steps: [roadmapStepSchema],
    current_step: {
      type: String,
      default: "step-1",
    },
    progress: {
      type: Number,
      default: 0,
    },
    completion_percentage: {
      type: Number,
      default: 0,
    },
    estimated_completion: {
      type: String,
      default: "1 Week",
    },
  },
  {
    timestamps: true,
  }
);

applicationRoadmapSchema.index({ user_id: 1, scheme_id: 1 });

export default mongoose.model("ApplicationRoadmap", applicationRoadmapSchema);
