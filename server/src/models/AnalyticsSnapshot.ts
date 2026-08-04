import mongoose from "mongoose";

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    metrics: {
      totalUsers: Number,
      activeUsers: Number,
      applicationsGenerated: Number,
      schemesViewed: Number,
      successRate: Number,
      verificationRate: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);
